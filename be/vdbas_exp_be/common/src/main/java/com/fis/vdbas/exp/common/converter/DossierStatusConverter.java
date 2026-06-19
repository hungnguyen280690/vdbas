package com.fis.vdbas.exp.common.converter;

import com.fis.vdbas.exp.common.enums.DossierStatus;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

/**
 * Map {@link DossierStatus} ↔ {@code EXP_DOSSIER.F_STATUS VARCHAR2(100)}.
 */
@Converter
public class DossierStatusConverter implements AttributeConverter<DossierStatus, String> {

    @Override
    public String convertToDatabaseColumn(DossierStatus attribute) {
        return attribute == null ? null : attribute.name();
    }

    @Override
    public DossierStatus convertToEntityAttribute(String dbData) {
        if (dbData == null || dbData.isBlank()) {
            return null;
        }
        // GAP-02: bọc try-catch để dữ liệu lạ (giá trị ngoài union CAPEX/OPEX) không làm vỡ
        // mọi truy vấn đọc ExpDossier (entity dùng chung). Trả null thay vì ném IllegalArgumentException.
        try {
            return DossierStatus.valueOf(dbData.trim());
        } catch (IllegalArgumentException ex) {
            return null;
        }
    }
}
