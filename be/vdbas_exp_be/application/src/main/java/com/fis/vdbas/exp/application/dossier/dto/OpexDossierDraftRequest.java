package com.fis.vdbas.exp.application.dossier.dto;

import jakarta.validation.constraints.Size;
import lombok.Data;

import java.time.LocalDate;

/**
 * Lưu nháp hồ sơ OPEX (schema {@code DossierDraftRequest}) — minimal validation, all optional.
 * <p>Khác CAPEX: nháp OPEX tạo MỚI một hồ sơ trạng thái DRAFT (sinh DOSSIER_CODE), KHÔNG ghi vào
 * EXP_DOSSIER_DRAFT (tránh drift FK DOSSIER_ID NOT NULL). Chỉ kiểm định dạng (VAL-02).</p>
 */
@Data
public class OpexDossierDraftRequest {

    @Size(max = 100, message = "{dossier.organizationCode.size}")
    private String organizationCode;

    @Size(max = 100, message = "{dossier.treasuryCode.size}")
    private String treasuryCode;

    private LocalDate sendDate;

    @Size(max = 100, message = "{dossier.dataSourceCode.size}")
    private String dataSourceCode;
}
