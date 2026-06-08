package com.fis.vdbas.exp.domain.document;

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
import java.util.UUID;

@Entity
@Table(name = "exp_document")
@Getter @Setter @NoArgsConstructor
public class ExpDocument implements Serializable {

    @Serial private static final long serialVersionUID = 1L;

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "document_id", columnDefinition = "uuid", updatable = false, nullable = false)
    private UUID documentId;

    @Column(name = "dossier_id", columnDefinition = "uuid", nullable = false)
    private UUID dossierId;

    @Column(name = "document_number", length = 200)
    private String documentNumber;

    @Column(name = "document_date")
    private LocalDate documentDate;

    @Column(name = "accounting_date")
    private LocalDate accountingDate;

    @Column(name = "currency_type_code", length = 100)
    private String currencyTypeCode;
}
