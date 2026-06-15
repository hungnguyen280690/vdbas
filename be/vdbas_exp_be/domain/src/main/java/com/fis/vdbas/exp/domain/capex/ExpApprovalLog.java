package com.fis.vdbas.exp.domain.capex;

import com.fis.vdbas.exp.domain.converter.UuidToRawConverter;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "EXP_APPROVAL_LOG")
@Getter
@Setter
@NoArgsConstructor
public class ExpApprovalLog {

    @Id
    @GeneratedValue
    @Column(name = "APPROVAL_LOG_ID", columnDefinition = "RAW(16)", nullable = false, updatable = false)
    private UUID approvalLogId;

    @Column(name = "DOSSIER_ID", columnDefinition = "RAW(16)", nullable = false)
    @Convert(converter = UuidToRawConverter.class)
    private UUID dossierId;

    @Column(name = "ACTION_USER", length = 100)
    private String actionUser;

    @Column(name = "ACTION_DATE")
    private LocalDateTime actionDate;

    @Column(name = "ACTION_ROLE", length = 50)
    private String actionRole;

    @Column(name = "STATE_CODE", length = 100)
    private String stateCode;

    @Column(name = "REASON", length = 2000)
    private String reason;

    @Column(name = "PARENT_ID", columnDefinition = "RAW(16)")
    @Convert(converter = UuidToRawConverter.class)
    private UUID parentId;

    @Column(name = "CREATED_BY", length = 100)
    private String createdBy;

    @Column(name = "CREATED_DATE")
    private LocalDateTime createdDate;

    @Column(name = "UPDATED_BY", length = 100)
    private String updatedBy;

    @Column(name = "UPDATED_DATE")
    private LocalDateTime updatedDate;
}
