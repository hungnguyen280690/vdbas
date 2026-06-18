package com.fis.vdbas.exp.domain.dossier;

import com.fis.vdbas.exp.domain.base.ExpAuditing;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.Lob;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

import java.util.UUID;

/**
 * Bản nháp auto-save — map bảng {@code EXP_DOSSIER_DRAFT} (DEC-04).
 * <p>{@code CONTENT} là JSON partial bất kỳ field nào user đã nhập.</p>
 */
@Entity
@Table(name = "EXP_DOSSIER_DRAFT")
@Getter
@Setter
@ToString
@NoArgsConstructor
public class ExpDossierDraft extends ExpAuditing<UUID> {

    @Id
    @GeneratedValue
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;

    @Override
    public UUID getId() {
        return this.id;
    }

    /** FK tới hồ sơ (EXP_DOSSIER.ID) — bản nháp luôn gắn với 1 hồ sơ DRAFT. */
    @Column(name = "DOSSIER_ID")
    private UUID dossierId;

    @Lob
    @Column(name = "CONTENT")
    private String content;

    /** Cờ active (1) / soft-deleted (0). */
    @Column(name = "STATUS")
    private Integer status = 1;
}
