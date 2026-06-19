package com.fis.vdbas.exp.common;

public final class CacheConstants {

    private CacheConstants() {
    }

    // ── Domain caches (add new entries here for each feature) ──────────────────
    public static final String CATEGORY_GROUP_CACHE = "category_group_cache";
    public static final String CATEGORY_CACHE       = "category_cache";

    // ── CAPEX Dossier domain ───────────────────────────────────────────────────
    public static final String DOSSIER_CACHE = "dossier_cache";
    public static final String LOV_CACHE     = "lov_cache";

    // DEC-06: WORKFLOW_CODE hardcode cho MVP (seed EXP_WORKFLOW.WORKFLOW_CODE='CAPEX_STANDARD')
    public static final String CAPEX_WORKFLOW_CODE = "CAPEX_STANDARD";

    // DOSSIER_TYPE_CODE mặc định cho hồ sơ CAPEX (DB hiện chỉ dùng 'CAPEX')
    public static final String CAPEX_DOSSIER_TYPE_CODE = "CAPEX";

    // ── OPEX Dossier domain (biến thể cô lập) ──────────────────────────────────
    // WORKFLOW_CODE hardcode cho OPEX MVP (seed EXP_WORKFLOW.WORKFLOW_CODE='OPEX_STANDARD')
    public static final String OPEX_WORKFLOW_CODE = "OPEX_STANDARD";

    // DOSSIER_TYPE_CODE cố định cho hồ sơ OPEX (immutable VAL-17)
    public static final String OPEX_DOSSIER_TYPE_CODE = "OPEX";
}
