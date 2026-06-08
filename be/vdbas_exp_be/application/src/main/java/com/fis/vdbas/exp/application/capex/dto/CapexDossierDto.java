package com.fis.vdbas.exp.application.capex.dto;

import com.fis.vdbas.common.dto.BaseAuditingDto;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.time.LocalDate;
import java.util.UUID;

@Data
@EqualsAndHashCode(callSuper = true)
public class CapexDossierDto extends BaseAuditingDto {

    private UUID dossierId;

    private String dossierCode;

    @NotNull(message = "{capex_dossier.sendDate.required}")
    private LocalDate sendDate;

    private String stateCode;

    @NotBlank(message = "{capex_dossier.projectCode.required}")
    @Size(max = 100, message = "{capex_dossier.projectCode.size}")
    private String projectCode;

    @Size(max = 500, message = "{capex_dossier.projectName.size}")
    private String projectName;

    @Size(max = 100, message = "{capex_dossier.projectSpecificCode.size}")
    private String projectSpecificCode;

    @Size(max = 500, message = "{capex_dossier.projectSpecificName.size}")
    private String projectSpecificName;

    @NotBlank(message = "{capex_dossier.projectManagementCode.required}")
    @Size(max = 100, message = "{capex_dossier.projectManagementCode.size}")
    private String projectManagementCode;

    @Size(max = 500, message = "{capex_dossier.projectManagementName.size}")
    private String projectManagementName;

    private String dataSourceCode;

    private String treasuryCode;

    private String treasuryName;

    private Long workflowId;

    private Integer dossierVersion;
}
