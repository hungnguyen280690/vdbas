package com.fis.vdbas.exp.domain.dossier;

import com.fis.vdbas.exp.domain.base.ExpAuditing;
import com.fis.vdbas.exp.common.converter.DossierStatusConverter;
import com.fis.vdbas.exp.common.enums.DossierStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Convert;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Hồ sơ Chi đầu tư/Chi thường xuyên — map bảng {@code EXP_DOSSIER}.
 * <p>
 * Lưu ý mapping:
 * <ul>
 *   <li>{@code version} dùng {@code @Version} JPA trực tiếp (DB: NUMBER(3)).</li>
 *   <li>{@code fStatus} dùng {@link DossierStatusConverter}.</li>
 *   <li>Tên LOV (treasuryName, projectName...) được denormalize thẳng vào bảng — không dùng {@code @ManyToOne}.</li>
 * </ul>
 * Audit fields (createdBy/createdAt/updatedBy/updatedAt) kế thừa từ {@link AbstractAuditing}.
 */
@Entity
@Table(name = "EXP_DOSSIER")
@Getter
@Setter
@ToString
@NoArgsConstructor
public class ExpDossier extends ExpAuditing<UUID> {

    @Id
    @GeneratedValue
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;

    @Override
    public UUID getId() {
        return this.id;
    }

    // ── Treasury (từ JWT scope — out-of-scope: nguồn claim) ───────────────────
    @Column(name = "TREASURY_CODE", nullable = false, length = 100)
    private String treasuryCode;

    @Column(name = "TREASURY_NAME", nullable = false, length = 500)
    private String treasuryName;

    // ── Mã hồ sơ (AUTO_FILL — sinh theo sequence, out-of-scope) ───────────────
    @Column(name = "DOSSIER_CODE", nullable = false, length = 100, updatable = false)
    private String dossierCode;

    @Version
    @Column(name = "VERSION", nullable = false)
    private Integer version = 0;

    @Column(name = "SEND_DATE", nullable = false)
    private LocalDate sendDate;

    // ── Dự án ────────────────────────────────────────────────────────────────
    @Column(name = "DOSSIER_TYPE_CODE", nullable = false, length = 100)
    private String dossierTypeCode;

    @Column(name = "PROJECT_CODE", length = 100)
    private String projectCode;

    @Column(name = "PROJECT_NAME", length = 500)
    private String projectName;

    @Column(name = "PROJECT_SPECIFIC_CODE", length = 100)
    private String projectSpecificCode;

    @Column(name = "PROJECT_SPECIFIC_NAME", length = 500)
    private String projectSpecificName;

    @Column(name = "ORGANIZATION_CODE", nullable = false, length = 100)
    private String organizationCode;

    @Column(name = "ORGANIZATION_NAME", nullable = false, length = 500)
    private String organizationName;

    // ── Trạng thái / workflow (BACKEND_MANAGED) ───────────────────────────────
    /** 1 = đang hiệu lực, 0 = đã xoá (soft-delete). */
    @Column(name = "STATUS", nullable = false)
    private Integer status = 1;

    @Convert(converter = DossierStatusConverter.class)
    @Column(name = "F_STATUS", nullable = false, length = 100)
    private DossierStatus fStatus;

    // DEC-06: set = CacheConstants.CAPEX_WORKFLOW_CODE trong service
    @Column(name = "WORKFLOW_CODE", nullable = false, length = 100)
    private String workflowCode;

    @Column(name = "DATA_SOURCE_CODE", nullable = false, length = 100)
    private String dataSourceCode;

    @Column(name = "ASSIGN_USER", nullable = false, length = 100)
    private String assignUser;

    /** BACKEND_MANAGED — thời hạn SLA do scheduler tính (out-of-scope phần job). */
    @Column(name = "SLA", nullable = false)
    private LocalDateTime sla;

    /** BACKEND_MANAGED — set khi submit (HASH_INFO, out-of-scope thuật toán). */
    @Column(name = "HASH_INFO", length = 2000)
    private String hashInfo;

    @Column(name = "COMPLETED_DATE")
    private LocalDate completedDate;
}
