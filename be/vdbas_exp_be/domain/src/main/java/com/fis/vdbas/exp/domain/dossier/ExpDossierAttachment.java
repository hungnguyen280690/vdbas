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

import java.util.UUID;

/**
 * File đính kèm hồ sơ — map bảng {@code EXP_DOSSIER_ATTACHMENT} (metadata).
 * <p>Phần lưu/đọc file vật lý + virus scan là out-of-scope (xem AttachmentService).</p>
 */
@Entity
@Table(name = "EXP_DOSSIER_ATTACHMENT")
@Getter
@Setter
@ToString
@NoArgsConstructor
public class ExpDossierAttachment extends ExpAuditing<UUID> {

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

    @Column(name = "ATTACHMENT_TYPE_CODE", nullable = false, length = 100)
    private String attachmentTypeCode;

    @Column(name = "FILE_NAME", nullable = false, length = 200)
    private String fileName;

    @Column(name = "FILE_TYPE", nullable = false, length = 100)
    private String fileType;

    @Column(name = "FILE_SIZE", nullable = false)
    private Long fileSize;

    /** INTERNAL_ONLY — đường dẫn file vật lý, KHÔNG expose ra API. */
    @Column(name = "FILE_PATH", nullable = false, length = 2000)
    private String filePath;

    @Column(name = "DESCRIPTION", length = 2000)
    private String description;
}
