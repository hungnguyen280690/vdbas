package com.fis.vdbas.exp.domain.approval;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.io.Serial;
import java.io.Serializable;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "exp_approval_log")
@Getter @Setter @NoArgsConstructor
public class ExpApprovalLog implements Serializable {

    @Serial private static final long serialVersionUID = 1L;

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "approval_log_id", columnDefinition = "uuid", updatable = false, nullable = false)
    private UUID approvalLogId;

    @Column(name = "dossier_id", columnDefinition = "uuid", nullable = false)
    private UUID dossierId;

    @Column(name = "action_user", length = 100)
    private String actionUser;

    @Column(name = "action_date")
    private LocalDateTime actionDate;

    @Column(name = "action_role", length = 100)
    private String actionRole;

    @Column(name = "state_code", length = 100)
    private String stateCode;

    @Column(name = "reason", length = 2000)
    private String reason;

    @Column(name = "created_by", length = 100)
    private String createdBy;

    @Column(name = "created_date")
    private LocalDateTime createdDate;
}
