"""
Minimal stubs for PyCaret internal classes, injected into sys.modules before
joblib.load() so the pkl can be deserialized without installing pycaret.
Only the methods used during inference (predict / predict_proba / transform) are implemented.
"""
from __future__ import annotations

import sys
from types import ModuleType

import numpy as np
import pandas as pd
from sklearn.base import BaseEstimator, TransformerMixin
from sklearn.pipeline import Pipeline as _SklearnPipeline


class TransformerWrapper(BaseEstimator, TransformerMixin):
    """Replicates pycaret TransformerWrapper column-selection + delegation logic."""

    def fit(self, X, y=None):
        return self

    def _get_cols(self, X: pd.DataFrame) -> list[str]:
        if getattr(self, "include", None):
            return [c for c in self.include if c in X.columns]
        if getattr(self, "exclude", None):
            return [c for c in X.columns if c not in self.exclude]
        return list(X.columns)

    def transform(self, X, y=None):
        cols = self._get_cols(X)
        if not cols:
            return X

        X = X.copy()
        result = self.transformer.transform(X[cols])

        # category_encoders returns a DataFrame
        if isinstance(result, pd.DataFrame):
            X = X.drop(columns=cols, errors="ignore")
            result = result.reset_index(drop=True)
            X = X.reset_index(drop=True)
            X = pd.concat([X, result[[c for c in result.columns if c not in X.columns]]], axis=1)
            # Update columns that were already there (e.g. ordinal encoding)
            for c in result.columns:
                if c in X.columns:
                    X[c] = result[c].values
            return X

        if hasattr(result, "toarray"):
            result = result.toarray()

        # numpy ndarray — same number of columns → update in-place
        if result.shape[1] == len(cols):
            X[cols] = result
        else:
            X = X.drop(columns=cols)
            X = pd.concat(
                [X.reset_index(drop=True), pd.DataFrame(result).reset_index(drop=True)],
                axis=1,
            )
        return X


class TransformerWrapperWithInverse(TransformerWrapper):
    """TransformerWrapper variant used for target label encoding.
    During feature transform it is a no-op; inverse_transform decodes predictions."""

    def transform(self, X, y=None):
        # The label encoder applies to the target (y), not to feature columns X.
        return X

    def inverse_transform(self, y):
        if hasattr(self.transformer, "inverse_transform"):
            result = self.transformer.inverse_transform(np.asarray(y).ravel())
            if isinstance(y, pd.Series):
                return pd.Series(result, index=y.index, name=y.name)
            return result
        return y


class Pipeline(_SklearnPipeline):
    """PyCaret's Pipeline subclass — overrides predict to apply label decoding."""

    def __init__(self, steps=None, **kwargs):
        if steps is not None:
            super().__init__(steps, **kwargs)

    def _transform_features(self, X: pd.DataFrame) -> pd.DataFrame:
        Xt = X
        for _, step in self.steps[:-1]:
            out = step.transform(Xt)
            Xt = out[0] if isinstance(out, tuple) else out
        return Xt

    def predict(self, X, **kw):
        Xt = self._transform_features(X)
        raw = self.steps[-1][1].predict(Xt)

        # Decode numeric predictions → original string labels
        for _, step in self.steps:
            if isinstance(step, TransformerWrapperWithInverse):
                try:
                    raw = step.inverse_transform(raw)
                except Exception:
                    pass
                break

        # If result is a DataFrame/Series, return the values
        if isinstance(raw, (pd.DataFrame, pd.Series)):
            return raw.values
        return raw

    def predict_proba(self, X, **kw):
        Xt = self._transform_features(X)
        return self.steps[-1][1].predict_proba(Xt)

    @property
    def classes_(self):
        return self.steps[-1][1].classes_


def _make_module(name: str) -> ModuleType:
    m = ModuleType(name)
    sys.modules[name] = m
    return m


def inject() -> None:
    """Register stub classes at the exact module paths the pkl expects."""
    pkg = _make_module("pycaret")
    internal = _make_module("pycaret.internal")

    # pipeline
    pl_mod = _make_module("pycaret.internal.pipeline")
    pl_mod.Pipeline = Pipeline
    internal.pipeline = pl_mod
    pkg.internal = internal

    # preprocess hierarchy
    pre = _make_module("pycaret.internal.preprocess")
    tr = _make_module("pycaret.internal.preprocess.transformers")
    tr.TransformerWrapper = TransformerWrapper
    tr.TransformerWrapperWithInverse = TransformerWrapperWithInverse
    pre.transformers = tr
    internal.preprocess = pre

    # Also register common sub-modules that may be referenced in the pkl
    for sub in ("pycaret.utils", "pycaret.utils.generic"):
        _make_module(sub)
