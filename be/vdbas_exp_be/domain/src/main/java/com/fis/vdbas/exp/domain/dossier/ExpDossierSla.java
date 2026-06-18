package com.fis.vdbas.exp.domain.dossier;

import com.fis.vdbas.exp.domain.base.ExpAuditing;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Chi tiết SLA của hồ sơ — map bảng {@code EXP_DOSSIER_SLA} (NOTE-04).
 * <p>INTERNAL: scheduler/notification job đọc. Không expose endpoint/DTO.</p>
 */
@Entity
@Table(name = "EXP_DOSSIER_SLA")
@Getter
@Setter
@ToString
@NoArgsConstructor
public class ExpDossierSla extends ExpAuditing<UUID> {

    @Id
    @GeneratedValue
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;

    @Override
    public UUID getId() {
        return this.id;
    }

    @Column(name = "DOSSIER_ID", nullable = false)
    private UUID dossierId;

    @Column(name = "STATE_CODE", length = 100)
    private String stateCode;

    @Column(name = "ASSIGN_USER", length = 100)
    private String assignUser;

    @Column(name = "SLA")
    private LocalDateTime sla;
}
