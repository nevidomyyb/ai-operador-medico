from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = "postgresql://medanalysis:medanalysis@localhost:5432/medanalysis"
    secret_key: str = "dev-secret-key-change-in-production"
    access_token_expire_minutes: int = 480
    model_path: str = "/app/models/best_model.pkl"
    diagnoses_csv: str = "/app/data/diagnosis_codes.csv"
    procedures_csv: str = "/app/data/procedure_codes.csv"
    usd_to_brl: float = 5.75


settings = Settings()
