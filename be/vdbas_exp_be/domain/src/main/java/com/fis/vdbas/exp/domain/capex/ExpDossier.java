package com.fis.vdbas.exp.domain.capex;

import com.fis.vdbas.common.domain.AbstractAuditing;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "EXP_DOSSIER")
@Getter
@Setter
@NoArgsConstructor
public class ExpDossier extends AbstractAuditing<UUID> {

    @Id
    @GeneratedValue
    @Column(name = "DOSSIER_ID", columnDefinition = "RAW(16)", nullable = false, updatable = false)
    private UUID dossierId;

    @Override
    public UUID getId() { return dossierId; }

    @Column(name = "DOSSIER_CODE", length = 100)
    private String dossierCode;

    @Column(name = "SEND_DATE")
    private LocalDate sendDate;

    @Column(name = "RECEIVE_DATE")
    private LocalDate receiveDate;

    @Column(name = "STATE_CODE", nullable = false, length = 100)
    private String stateCode;

    @Column(name = "PROJECT_CODE", nullable = false, length = 100)
    private String projectCode;

    @Column(name = "PROJECT_NAME", length = 500)
    private String projectName;

    @Column(name = "PROJECT_SPECIFIC_CODE", length = 100)
    private String projectSpecificCode;

    @Column(name = "PROJECT_SPECIFIC_NAME", length = 500)
    private String projectSpecificName;

    @Column(name = "PROJECT_MANAGEMENT_NAME", length = 500)
    private String projectManagementName;

    @Column(name = "INVESTOR_NAME", length = 500)
    private String investorName;

    @Column(name = "TREASURY_CODE", nullable = false, length = 100)
    private String treasuryCode;

    @Column(name = "DATA_SOURCE_CODE", nullable = false, length = 100)
    private String dataSourceCode;

    @Column(name = "WORKFLOW_ID", nullable = false)
    private Long workflowId;

    @Column(name = "ASSIGN_USER", length = 100)
    private String assignUser;

    @Column(name = "SLA")
    private LocalDate sla;

    @Column(name = "COMPLETED_DATE")
    private LocalDate completedDate;

    @Column(name = "DOSSIER_VERSION")
    private Integer dossierVersion = 1;

    @Column(name = "STATUS")
    private Integer status = 1;

    @Column(name = "HASH_INFO", length = 2000)
    private String hashInfo;

    @Column(name = "IS_DELETED", nullable = false)
    private Integer isDeleted = 0;
}
