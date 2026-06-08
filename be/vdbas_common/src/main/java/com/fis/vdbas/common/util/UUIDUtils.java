package com.fis.vdbas.common.util;

import java.util.UUID;

public final class UUIDUtils {

    private UUIDUtils() {
    }

    public static UUID parseUUID(String id) {
        if (id == null || id.isBlank()) return null;
        if (id.length() == 32) {
            id = id.replaceFirst("(\\w{8})(\\w{4})(\\w{4})(\\w{4})(\\w{12})", "$1-$2-$3-$4-$5");
        }
        return UUID.fromString(id);
    }
}
