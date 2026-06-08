package com.fis.vdbas.exp.domain.capex;

import com.fis.vdbas.common.domain.AbstractAuditing;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

import java.io.Serial;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "exp_dossier")
@Getter
@Setter
@NoArgsConstructor
@ToString
public class CapexDossier extends AbstractAuditing<UUID> {

    @Serial
    private static final long serialVersionUID = 1L;

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "dossier_id", columnDefinition = "uuid", updatable = false, nullable = false)
    private UUID dossierId;

    @Column(name = "dossier_code", length = 100)
    private String dossierCode;

    @Column(name = "send_date")
    private LocalDate sendDate;

    @Column(name = "state_code", nullable = false, length = 100)
    private String stateCode = "DRAFT";

    @Column(name = "project_code", nullable = false, length = 100)
    private String projectCode;

    @Column(name = "project_name", length = 500)
    private String projectName;

    @Column(name = "project_specific_code", length = 100)
    private String projectSpecificCode;

    @Column(name = "project_specific_name", length = 500)
    private String projectSpecificName;

    @Column(name = "project_management_code", length = 100)
    private String projectManagementCode;

    @Column(name = "project_management_name", length = 500)
    private String projectManagementName;

    @Column(name = "data_source_code", nullable = false, length = 100)
    private String dataSourceCode = "MANUAL";

    @Column(name = "workflow_id")
    private Long workflowId;

    @Column(name = "treasury_code", length = 100)
    private String treasuryCode;

    @Version
    @Column(name = "dossier_version")
    private Integer dossierVersion;

    @Column(name = "is_deleted", nullable = false)
    private Integer deleted = 0;

    @Column(name = "delete_reason", length = 500)
    private String deleteReason;

    @Column(name = "end_date")
    private LocalDateTime endDate;

    @Override
    public UUID getId() {
        return dossierId;
    }
}
