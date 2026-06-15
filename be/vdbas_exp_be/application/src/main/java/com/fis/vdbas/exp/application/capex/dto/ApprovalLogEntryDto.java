package com.fis.vdbas.exp.application.capex.dto;

import lombok.Data;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
public class ApprovalLogEntryDto {
    private UUID logId;
    private String actionUser;
    private LocalDateTime actionDate;
    private String actionRole;
    private String stateCode;
    private String reason;
}
