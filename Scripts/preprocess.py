"""
preprocess.py — Genera los JSON estáticos para la app desde los CSVs originales.
Corre una vez: python scripts/preprocess.py
"""

import pandas as pd
import json
import math
from pathlib import Path
import time

SRC = Path("Data")
OUT = Path("public/data")
OUT.mkdir(parents=True, exist_ok=True)


def clean_nan(obj):
    """Recursively replace float NaN/Inf with None for JSON serialization."""
    if isinstance(obj, dict):
        return {k: clean_nan(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [clean_nan(v) for v in obj]
    if isinstance(obj, float):
        if math.isnan(obj) or math.isinf(obj):
            return None
    return obj


def round_floats(obj, digits=4):
    if isinstance(obj, dict):
        return {k: round_floats(v, digits) for k, v in obj.items()}
    if isinstance(obj, list):
        return [round_floats(v, digits) for v in obj]
    if isinstance(obj, float):
        if math.isnan(obj) or math.isinf(obj):
            return None
        return round(obj, digits)
    return obj


def to_records(df, digits=4):
    return round_floats(clean_nan(df.to_dict(orient="records")), digits)


def classify_ideology_bucket(value):
    if pd.isna(value):
        return None
    if value < -0.75:
        return "extremeLeft"
    if value < -0.5:
        return "left"
    if value < -0.25:
        return "centerLeft"
    if value <= 0.25:
        return "center"
    if value <= 0.5:
        return "centerRight"
    if value <= 0.75:
        return "right"
    return "extremeRight"


t0 = time.time()

# -------------------------------------------------------------------
# 1. Load
# -------------------------------------------------------------------
print("Cargando CSVs...")
muni_df = pd.read_csv(SRC / "MIS_Ideology_2026-04-08.csv", low_memory=False)
party_df = pd.read_csv(SRC / "MIS_Ideology_party_data_2026-04-08.csv", low_memory=False)
party_year_df = pd.read_csv(SRC / "party_year_ideology.csv", sep=";", low_memory=False)
print(f"  muni: {len(muni_df):,} | party: {len(party_df):,}")
print(f"  Tiempo: {time.time() - t0:.1f}s")

party_year_lookup = (
    party_year_df[[
        "ANO_ELEICAO",
        "NUM_PART",
        "SIGLA_PARTIDO",
        "NOME_PARTIDO",
        "IDEOLOGY",
        "imputed",
    ]]
    .drop_duplicates()
    .rename(columns={
        "ANO_ELEICAO": "year",
        "NUM_PART": "party_code",
        "SIGLA_PARTIDO": "party_label",
        "NOME_PARTIDO": "party_name",
        "IDEOLOGY": "party_ideology",
        "imputed": "party_imputed",
    })
)

# -------------------------------------------------------------------
# 2. Rangos
# -------------------------------------------------------------------
print("\n--- Rangos ideológicos ---")
for col in ["ideo_na", "ideo_imp", "ideopref", "ideogov", "ideo_pres"]:
    if col in muni_df.columns:
        v = muni_df[col].dropna()
        if len(v):
            print(
                f"  {col}: [{v.min():.4f}, {v.max():.4f}], mean={v.mean():.4f}, sd={v.std():.4f}"
            )

# -------------------------------------------------------------------
# 3. municipios_{year}.json
# -------------------------------------------------------------------
print("\nGenerando municipios_{year}.json...")
COLS = [
    "year",
    "cod_tse",
    "GEOCODIG_M",
    "cod_uf",
    "uf",
    "tse_name",
    "ibge_name",
    "ideo_na",
    "ideo_imp",
    "ideopref",
    "ideogov",
    "ideo_pres",
    "closeness",
    "pol_sanisarto",
    "pol_dalton_norm",
    "enep",
    "fragf",
    "dem_vhn",
    "compet",
    "turnout",
    "tot_votos",
    "qtde_eleitores",
    "national",
    "sec_round",
]
for year, grp in muni_df.groupby("year"):
    valid = grp[grp["ideo_imp"].notna()].copy()
    available = [c for c in COLS if c in valid.columns]
    records = to_records(valid[available])
    with open(OUT / f"municipios_{int(year)}.json", "w") as f:
        json.dump(records, f)
    print(f"  municipios_{int(year)}.json: {len(records):,} municipios")

# -------------------------------------------------------------------
# 4. national_trend.json
# -------------------------------------------------------------------
print("\nGenerando national_trend.json...")
trend = (
    muni_df.groupby("year")["ideo_imp"]
    .agg(["mean", "std", "min", "max", "count"])
    .reset_index()
)
trend.columns = ["year", "mean", "sd", "min", "max", "n"]
trend = trend.dropna().sort_values("year")
with open(OUT / "national_trend.json", "w") as f:
    json.dump(to_records(trend), f)
print(f"  {int(trend.year.min())}–{int(trend.year.max())}, {len(trend)} años")

# -------------------------------------------------------------------
# 5. polarization_index.json
# -------------------------------------------------------------------
print("Generando polarization_index.json...")
pol = muni_df.groupby("year")["ideo_imp"].agg(["mean", "std", "count"]).reset_index()
pol.columns = ["year", "mean_ideo", "dispersion", "n_muni"]
pol = pol.dropna().sort_values("year")
with open(OUT / "polarization_index.json", "w") as f:
    json.dump(to_records(pol), f)

# -------------------------------------------------------------------
# 6. state_summary.json
# -------------------------------------------------------------------
print("Generando state_summary.json...")
state = (
    muni_df.groupby(["year", "uf"])["ideo_imp"]
    .agg(["mean", "std", "count"])
    .reset_index()
)
state.columns = ["year", "uf", "mean_ideo", "sd_ideo", "n_muni"]
state = state.dropna().sort_values(["year", "uf"])
with open(OUT / "state_summary.json", "w") as f:
    json.dump(to_records(state), f)
print(
    f"  {state['uf'].nunique()} estados × {state['year'].nunique()} años = {len(state)} registros"
)

# -------------------------------------------------------------------
# 6b. dashboard_national.json
# -------------------------------------------------------------------
print("Generando dashboard_national.json...")
valid_muni = muni_df[muni_df["ideo_imp"].notna()].copy()
valid_muni["bucket"] = valid_muni["ideo_imp"].map(classify_ideology_bucket)

dashboard = (
    valid_muni.groupby("year")
    .agg(
        coverage_n=("ideo_imp", "count"),
        ideology_mean=("ideo_imp", "mean"),
        ideology_sd=("ideo_imp", "std"),
        ideology_min=("ideo_imp", "min"),
        ideology_max=("ideo_imp", "max"),
        polarization_sani_sartori=("pol_sanisarto", "mean"),
        polarization_gross_sigelman=("pol_gross_sigelman", "mean"),
        polarization_dalton_norm=("pol_dalton_norm", "mean"),
        party_system_enep=("enep", "mean"),
        party_system_fragf=("fragf", "mean"),
        party_system_dem_vhn=("dem_vhn", "mean"),
        party_system_turnout=("turnout", "mean"),
        party_system_compet=("compet", "mean"),
        party_system_closeness=("closeness", "mean"),
    )
    .reset_index()
)

shares = (
    valid_muni.groupby(["year", "bucket"]).size().unstack(fill_value=0)
    .reset_index()
)
for bucket in ["extremeLeft", "left", "centerLeft", "center", "centerRight", "right", "extremeRight"]:
    if bucket not in shares.columns:
        shares[bucket] = 0

shares["share_total"] = shares[["extremeLeft", "left", "centerLeft", "center", "centerRight", "right", "extremeRight"]].sum(axis=1)
shares["left_share"] = (shares["extremeLeft"] + shares["left"] + shares["centerLeft"]) / shares["share_total"]
shares["center_share"] = shares["center"] / shares["share_total"]
shares["right_share"] = (shares["centerRight"] + shares["right"] + shares["extremeRight"]) / shares["share_total"]
shares = shares[["year", "left_share", "center_share", "right_share"]]

party_system_nep = (
    party_df.groupby("year")
    .apply(
        lambda grp: 1 / ((grp.groupby("party")["qtde_votos"].sum() / grp["qtde_votos"].sum()) ** 2).sum()
        if grp["qtde_votos"].sum() > 0
        else None,
        include_groups=False,
    )
    .reset_index(name="party_system_nep_national")
)

dashboard = dashboard.merge(shares, on="year", how="left")
dashboard = dashboard.merge(party_system_nep, on="year", how="left")
dashboard = dashboard.sort_values("year")

with open(OUT / "dashboard_national.json", "w") as f:
    json.dump(to_records(dashboard), f)
print(f"  dashboard_national: {len(dashboard):,} filas")

# -------------------------------------------------------------------
# 7. party_lookup.json
# -------------------------------------------------------------------
print("Generando party_lookup.json...")
with open(OUT / "party_lookup.json", "w") as f:
    json.dump(to_records(party_year_lookup), f)

# -------------------------------------------------------------------
# 8. party_national.json — agregados nacionales por partido-año
# -------------------------------------------------------------------
print("Generando party_national.json...")
valid_p = party_df[party_df["IDEO_IMPUTED"].notna()].copy()
valid_p["party"] = valid_p["party"].astype(int)
valid_p["weighted"] = valid_p["qtde_votos"] * valid_p["IDEO_IMPUTED"]
valid_p = valid_p.merge(
    party_year_lookup,
    left_on=["year", "party"],
    right_on=["year", "party_code"],
    how="left",
)

# Nacional: weighted mean por party × year
nat = (
    valid_p.groupby(["year", "party"])
    .agg(
        weighted=("weighted", "sum"),
        qtde_votos=("qtde_votos", "sum"),
        ideo_unw=("IDEO_IMPUTED", "mean"),
    )
    .reset_index()
)
nat["ideo_weighted"] = nat["weighted"] / nat["qtde_votos"]
nat = nat.dropna(subset=["ideo_weighted"])
nat = nat.drop(columns=["weighted"]).rename(
    columns={"qtde_votos": "votes", "ideo_unw": "ideo_unweighted"}
)
nat["ideo_weighted"] = nat["ideo_weighted"].where(nat["votes"] > 0)
nat = nat.merge(
    party_year_lookup,
    left_on=["year", "party"],
    right_on=["year", "party_code"],
    how="left",
)
nat = nat[[
    "year",
    "party",
    "votes",
    "ideo_unweighted",
    "ideo_weighted",
    "party_label",
    "party_ideology",
]]

# Solo los ~25 partidos con más votos por año
top25 = (
    nat.sort_values(["year", "votes"], ascending=[True, False])
    .groupby("year")
    .head(25)[["year", "party"]]
    .reset_index(drop=True)
)
top_parties = set(zip(top25["year"], top25["party"]))

with open(OUT / "party_national.json", "w") as f:
    json.dump(to_records(nat), f)
print(f"  party_national: {len(nat):,} filas")

# -------------------------------------------------------------------
# 9. party_state.json — agregados por partido × UF × año
# -------------------------------------------------------------------
print("Generando party_state.json...")
st = (
    valid_p.groupby(["year", "party", "uf"])
    .agg(
        weighted=("weighted", "sum"),
        qtde_votos=("qtde_votos", "sum"),
        ideo_unw=("IDEO_IMPUTED", "mean"),
    )
    .reset_index()
)
st["ideo_weighted"] = st["weighted"] / st["qtde_votos"]
st = st.dropna(subset=["ideo_weighted"])
st = st.drop(columns=["weighted"]).rename(
    columns={"qtde_votos": "votes", "ideo_unw": "ideo_unweighted"}
)
st["ideo_weighted"] = st["ideo_weighted"].where(st["votes"] > 0)
st = st.merge(
    party_year_lookup,
    left_on=["year", "party"],
    right_on=["year", "party_code"],
    how="left",
)
st = st[[
    "year",
    "party",
    "uf",
    "votes",
    "ideo_unweighted",
    "ideo_weighted",
    "party_label",
    "party_ideology",
]]

# Merge to keep only top parties per year (vectorized)
st_filtered = st.merge(top25, on=["year", "party"], how="inner")

with open(OUT / "party_state.json", "w") as f:
    json.dump(to_records(st_filtered), f)
print(f"  party_state: {len(st_filtered):,} filas")

# -------------------------------------------------------------------
# 9b. party_municipal_{year}.json — agregados por partido × municipio × año
# -------------------------------------------------------------------
print("Generando party_municipal_{year}.json...")
municipal_party_cols = [
    "year",
    "GEOCODIG_M",
    "uf",
    "party",
    "qtde_votos",
    "tot_votos",
    "prop_votos",
    "IDEOLOGY",
    "IDEO_IMPUTED",
    "id_contr_na",
    "id_contr_imp",
]
available_party_cols = [c for c in municipal_party_cols if c in party_df.columns]
municipal_party = party_df[available_party_cols].copy()
municipal_party = municipal_party.rename(
    columns={
        "qtde_votos": "votes",
        "tot_votos": "total_votes",
        "prop_votos": "vote_share",
        "IDEOLOGY": "ideo_observed",
        "IDEO_IMPUTED": "ideo_imputed",
        "id_contr_na": "ideo_contribution_observed",
        "id_contr_imp": "ideo_contribution_imputed",
    }
)
municipal_party = municipal_party[municipal_party["votes"].fillna(0) > 0].copy()
municipal_party = municipal_party.merge(
    party_year_lookup,
    left_on=["year", "party"],
    right_on=["year", "party_code"],
    how="left",
)
municipal_party = municipal_party[[
    "year",
    "GEOCODIG_M",
    "party",
    "votes",
    "vote_share",
    "ideo_imputed",
    "party_label",
    "party_ideology",
    "party_imputed",
]]

for year, grp in municipal_party.groupby("year"):
    with open(OUT / f"party_municipal_{int(year)}.json", "w") as f:
        json.dump(to_records(grp), f)
    print(f"  party_municipal_{int(year)}.json: {len(grp):,} filas")

# -------------------------------------------------------------------
# 10. Summary
# -------------------------------------------------------------------
print(f"\n--- Completo ({time.time() - t0:.1f}s) ---")
for p in sorted(OUT.glob("*")):
    mb = p.stat().st_size / (1024 * 1024)
    print(
        f"  {p.name}: {mb:.2f} MB"
        if mb >= 1
        else f"  {p.name}: {p.stat().st_size / 1024:.0f} KB"
    )
