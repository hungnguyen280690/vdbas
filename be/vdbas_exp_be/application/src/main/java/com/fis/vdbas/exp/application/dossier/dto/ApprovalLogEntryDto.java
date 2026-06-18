package com.fis.vdbas.exp.application.dossier.dto;

import com.fis.vdbas.exp.common.enums.ActionRole;
import com.fis.vdbas.exp.common.enums.DossierStatus;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

/** Một bước trong luồng phê duyệt (schema {@code ApprovalLogEntry}). */
@Data
public class ApprovalLogEntryDto {

    private UUID id;
    private String actionUser;
    /** DEC-07: họ tên từ JWT. */
    private String actionUserName;
    private ActionRole actionRole;
    private LocalDateTime actionDate;
    private String reason;
    private DossierStatus stateCode;
    private String stateLabel;
    private UUID parentId;
    /** NOTE-03: có ký số không (EXISTS trong EXP_DIGITAL_SIGNED). */
    private Boolean digitalSigned;
}
