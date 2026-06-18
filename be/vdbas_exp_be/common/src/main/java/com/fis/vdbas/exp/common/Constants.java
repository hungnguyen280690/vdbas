package com.fis.vdbas.exp.common;

public final class Constants {

    private Constants() {
    }


    public static final class Resource {
        public static final String CATEGORY_GROUP = "CategoryGroup";
        public static final String CATEGORY       = "Category";
        // ── CAPEX Dossier domain ───────────────────────────────────────────────
        public static final String DOSSIER    = "Dossier";
        public static final String DOCUMENT   = "Document";
        public static final String ATTACHMENT = "Attachment";
    }


    public static final class ErrorCode {
        // ── Category domain ────────────────────────────────────────────────────
        public static final String CATEGORY_GROUP_NOT_FOUND      = "CATEGORY_GROUP_NOT_FOUND";
        public static final String CATEGORY_GROUP_CODE_DUPLICATE = "CATEGORY_GROUP_CODE_DUPLICATE";
        public static final String CATEGORY_NOT_FOUND            = "CATEGORY_NOT_FOUND";
        public static final String CATEGORY_ITEM_CODE_DUPLICATE  = "CATEGORY_ITEM_CODE_DUPLICATE";
        public static final String CATEGORY_GROUP_CANNOT_DELETE_SYSTEM = "CATEGORY_GROUP_CANNOT_DELETE_SYSTEM";

        // ── CAPEX Dossier domain (mã chuẩn VDBAS-EXP-* / VDBAS-VAL-*) ───────────
        public static final String DOSSIER_NOT_FOUND        = "VDBAS-EXP-0001";
        public static final String DOSSIER_CODE_DUPLICATE   = "VDBAS-EXP-0002";
        public static final String DOSSIER_INVALID_STATE    = "VDBAS-EXP-0003";
        public static final String DOSSIER_VERSION_CONFLICT = "VDBAS-EXP-0005";
        public static final String DOSSIER_NO_DOCUMENT      = "VDBAS-EXP-0012";
        public static final String DOCUMENT_NOT_FOUND       = "VDBAS-EXP-0006";
        public static final String ATTACHMENT_NOT_FOUND     = "VDBAS-EXP-0007";
        public static final String REASON_REQUIRED          = "VDBAS-VAL-0002";
    }


    public static final class MessageKey {
        // ── Category domain ────────────────────────────────────────────────────
        public static final String CATEGORY_GROUP_NOT_FOUND      = "error.category_group.notfound";
        public static final String CATEGORY_GROUP_CODE_DUPLICATE = "error.category_group.code.duplicate";
        public static final String CATEGORY_NOT_FOUND            = "error.category.notfound";
        public static final String CATEGORY_ITEM_CODE_DUPLICATE  = "error.category.item_code.duplicate";
        public static final String CATEGORY_GROUP_SYSTEM         = "error.category_group.system";

        // ── CAPEX Dossier domain ───────────────────────────────────────────────
        public static final String DOSSIER_NOT_FOUND        = "error.dossier.notfound";
        public static final String DOSSIER_CODE_DUPLICATE   = "error.dossier.code.duplicate";
        public static final String DOSSIER_INVALID_STATE    = "error.dossier.invalid_state";
        public static final String DOSSIER_VERSION_CONFLICT = "error.dossier.version_conflict";
        public static final String DOSSIER_NO_DOCUMENT      = "error.dossier.no_document";
        public static final String DOCUMENT_NOT_FOUND       = "error.document.notfound";
        public static final String ATTACHMENT_NOT_FOUND     = "error.attachment.notfound";
        public static final String REASON_REQUIRED          = "error.dossier.reason_required";
    }
}
