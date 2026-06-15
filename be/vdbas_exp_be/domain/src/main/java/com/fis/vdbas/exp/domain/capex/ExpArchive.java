package com.fis.vdbas.exp.domain.capex;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "EXP_ARCHIVE")
@Getter
@Setter
@NoArgsConstructor
public class ExpArchive {

    @Id
    @GeneratedValue
    @Column(name = "ARCHIVE_ID", columnDefinition = "RAW(16)", nullable = false, updatable = false)
    private UUID archiveId;

    @Column(name = "DOSSIER_ID", columnDefinition = "RAW(16)", nullable = false)
    @JdbcTypeCode(SqlTypes.BINARY)
    private UUID dossierId;

    @Column(name = "FILE_NAME", length = 500)
    private String fileName;

    @Column(name = "FILE_PATH", length = 2000)
    private String filePath;

    @Column(name = "ARCHIVE_TYPE", length = 100)
    private String archiveType;

    @Column(name = "ARCHIVE_DATE")
    private LocalDate archiveDate;

    @Column(name = "DESCRIPTION", length = 2000)
    private String description;

    @Column(name = "CREATED_BY", length = 100)
    private String createdBy;

    @Column(name = "CREATED_DATE")
    private LocalDateTime createdDate;

    @Column(name = "UPDATED_BY", length = 100)
    private String updatedBy;

    @Column(name = "UPDATED_DATE")
    private LocalDateTime updatedDate;
}
