package com.fis.vdbas.exp.domain.dossier;

import com.fis.vdbas.exp.domain.base.ExpAuditing;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Transient;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

import java.time.LocalDate;
import java.util.UUID;

/**
 * Chứng từ trong hồ sơ — map bảng {@code EXP_DOCUMENT}.
 * <p>DEC-02: {@code originalAmount} nullable (giao dịch VND thuần không có nguyên tệ).</p>
 * <p>TODO MVP+1: EXP_DOCUMENT_ATTACHMENT (DEC-05 — ngoài scope MVP).</p>
 */
@Entity
@Table(name = "EXP_DOCUMENT")
@Getter
@Setter
@ToString
@NoArgsConstructor
public class ExpDocument extends ExpAuditing<UUID> {

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

    @Column(name = "TREASURY_CODE", nullable = false, length = 100)
    private String treasuryCode;

    @Column(name = "TREASURY_NAME", nullable = false, length = 500)
    private String treasuryName;

    @Column(name = "DOCUMENT_TYPE_CODE", nullable = false, length = 100)
    private String documentTypeCode;

    @Column(name = "DOCUMENT_NAME", nullable = false, length = 500)
    private String documentName;

    @Column(name = "DOCUMENT_NO", nullable = false, length = 200)
    private String documentNo;

    @Column(name = "DOCUMENT_DATE", nullable = false)
    private LocalDate documentDate;

    @Column(name = "ACCOUNTING_DATE", nullable = false)
    private LocalDate accountingDate;

    /** DEC-02: nullable — null khi giao dịch VND thuần. */
    @Column(name = "ORIGINAL_AMOUNT")
    private Long originalAmount;

    @Column(name = "BASE_AMOUNT", nullable = false)
    private Long baseAmount;

    /** 1 = hiệu lực, 0 = không hiệu lực (soft-delete). */
    @Column(name = "STATUS", nullable = false)
    private Integer status = 1;

    /** NOTE-01: STT tính runtime bằng ROW_NUMBER() — không có cột DB. */
    @Transient
    private Integer seqNo;
}
