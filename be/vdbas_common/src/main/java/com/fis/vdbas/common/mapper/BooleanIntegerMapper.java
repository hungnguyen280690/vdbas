package com.fis.vdbas.common.mapper;

/**
 * Common MapStruct interface to handle Integer/Boolean mappings for Oracle database compatibility.
 * <p>
 * Extending this interface in any MapStruct Mapper will automatically apply these mapping methods.
 * </p>
 */
public interface BooleanIntegerMapper {

    default Integer booleanToInteger(Boolean bool) {
        if (bool == null) {
            return null;
        }
        return bool ? 1 : 0;
    }

    default Boolean integerToBoolean(Integer value) {
        if (value == null) {
            return null;
        }
        return value != 0;
    }
}
