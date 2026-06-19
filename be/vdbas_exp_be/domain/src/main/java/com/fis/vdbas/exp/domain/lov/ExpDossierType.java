package com.fis.vdbas.exp.domain.lov;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

/** LOV Loại hồ sơ (CAPEX/OPEX) — map bảng {@code EXP_DOSSIER_TYPE} (chỉ đọc). */
@Entity
@Table(name = "EXP_DOSSIER_TYPE")
@Getter
@Setter
@ToString
@NoArgsConstructor
public class ExpDossierType {

    @Id
    @Column(name = "DOSSIER_TYPE_CODE", length = 100)
    private String dossierTypeCode;

    @Column(name = "DOSSIER_TYPE_NAME", length = 500)
    private String dossierTypeName;

    @Column(name = "DESCRIPTION", length = 2000)
    private String description;

    @Column(name = "STATUS")
    private Integer status;
}
