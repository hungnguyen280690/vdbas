package com.fis.vdbas.exp.application.capex.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class WorkflowActionDto {

    @NotBlank(message = "{capex_dossier.workflow.action.required}")
    private String action;

    @Size(min = 10, max = 500, message = "{capex_dossier.workflow.reason.size}")
    private String reason;
}
