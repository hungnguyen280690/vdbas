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
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "exp_archive")
@Getter @Setter @NoArgsConstructor
public class ExpArchive implements Serializable {

    @Serial private static final long serialVersionUID = 1L;

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "archive_id", columnDefinition = "uuid", updatable = false, nullable = false)
    private UUID archiveId;

    @Column(name = "dossier_id", columnDefinition = "uuid", nullable = false)
    private UUID dossierId;

    @Column(name = "file_name", length = 200)
    private String fileName;

    @Column(name = "archive_type", length = 20)
    private String archiveType;

    @Column(name = "description", length = 2000)
    private String description;

    @Column(name = "archive_date")
    private LocalDate archiveDate;

    @Column(name = "created_by", length = 100)
    private String createdBy;

    @Column(name = "created_date")
    private LocalDateTime createdDate;
}
