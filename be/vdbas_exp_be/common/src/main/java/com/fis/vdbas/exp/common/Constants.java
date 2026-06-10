package com.fis.vdbas.exp.common;

public final class Constants {

    private Constants() {
    }


    public static final class Resource {
        public static final String CATEGORY_GROUP = "CategoryGroup";
        public static final String CATEGORY       = "Category";
    }


    public static final class ErrorCode {
        // ── Category domain ────────────────────────────────────────────────────
        public static final String CATEGORY_GROUP_NOT_FOUND      = "CATEGORY_GROUP_NOT_FOUND";
        public static final String CATEGORY_GROUP_CODE_DUPLICATE = "CATEGORY_GROUP_CODE_DUPLICATE";
        public static final String CATEGORY_NOT_FOUND            = "CATEGORY_NOT_FOUND";
        public static final String CATEGORY_ITEM_CODE_DUPLICATE  = "CATEGORY_ITEM_CODE_DUPLICATE";
        public static final String CATEGORY_GROUP_CANNOT_DELETE_SYSTEM = "CATEGORY_GROUP_CANNOT_DELETE_SYSTEM";
    }


    public static final class MessageKey {
        // ── Category domain ────────────────────────────────────────────────────
        public static final String CATEGORY_GROUP_NOT_FOUND      = "error.category_group.notfound";
        public static final String CATEGORY_GROUP_CODE_DUPLICATE = "error.category_group.code.duplicate";
        public static final String CATEGORY_NOT_FOUND            = "error.category.notfound";
        public static final String CATEGORY_ITEM_CODE_DUPLICATE  = "error.category.item_code.duplicate";
        public static final String CATEGORY_GROUP_SYSTEM         = "error.category_group.system";
    }
}
