package com.fis.vdbas.exp.common.converter;

import com.fis.vdbas.exp.common.enums.ActionRole;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

/**
 * Map {@link ActionRole} ↔ {@code EXP_APPROVAL_LOG.ACTION_ROLE VARCHAR2(100)}.
 */
@Converter
public class ActionRoleConverter implements AttributeConverter<ActionRole, String> {

    @Override
    public String convertToDatabaseColumn(ActionRole attribute) {
        return attribute == null ? null : attribute.name();
    }

    @Override
    public ActionRole convertToEntityAttribute(String dbData) {
        if (dbData == null || dbData.isBlank()) {
            return null;
        }
        return ActionRole.valueOf(dbData.trim());
    }
}
