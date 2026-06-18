package com.fis.vdbas.exp.application.audit.dto;

import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

/** Một dòng audit (schema {@code AuditLogEntry}). */
@Data
public class AuditLogEntryDto {

    private UUID id;
    private String actionType;
    private LocalDateTime actionTimestamp;
    private String userId;
    /** Lấy từ JWT claim tại thời điểm ghi log (out-of-scope nguồn claim). */
    private String userDisplayName;
    private String ipAddress;
    private String tableName;
    private String recordId;
    private String oldValue;
    private String newValue;
}
