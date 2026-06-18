package com.fis.vdbas.exp.application.dossier.dto;

import com.fis.vdbas.exp.common.enums.DossierStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

/**
 * Kết quả tạo/lưu/sửa hồ sơ (phần {@code data} của DossierCreateResponse / DossierUpdateResponse).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DossierMutationResult {

    private UUID id;
    private String dossierCode;
    private DossierStatus fStatus;
    private Integer version;
}
