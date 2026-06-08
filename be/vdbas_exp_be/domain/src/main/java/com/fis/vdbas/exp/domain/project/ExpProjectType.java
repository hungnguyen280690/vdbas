package com.fis.vdbas.exp.domain.project;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.io.Serial;
import java.io.Serializable;

@Entity
@Table(name = "exp_project_type")
@Getter @Setter @NoArgsConstructor
public class ExpProjectType implements Serializable {

    @Serial private static final long serialVersionUID = 1L;

    @Id
    @Column(name = "project_type_code", length = 100, nullable = false)
    private String projectTypeCode;

    @Column(name = "project_type_name", length = 500)
    private String projectTypeName;
}
