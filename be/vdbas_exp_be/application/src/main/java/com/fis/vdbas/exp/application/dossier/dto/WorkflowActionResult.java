package com.fis.vdbas.exp.application.dossier.dto;

import com.fis.vdbas.exp.common.enums.DossierStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

/** Kết quả chuyển trạng thái workflow (phần {@code data} của WorkflowActionResponse). */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WorkflowActionResult {

    private UUID dossierId;
    private DossierStatus fStatus;
    private String fStatusName;
    private String assignUser;
}
