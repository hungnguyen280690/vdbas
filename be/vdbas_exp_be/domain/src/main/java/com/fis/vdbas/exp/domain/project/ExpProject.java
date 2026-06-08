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
@Table(name = "exp_project")
@Getter @Setter @NoArgsConstructor
public class ExpProject implements Serializable {

    @Serial private static final long serialVersionUID = 1L;

    @Id
    @Column(name = "project_code", length = 100, nullable = false)
    private String projectCode;

    @Column(name = "project_name", length = 500)
    private String projectName;

    @Column(name = "investor_code", length = 100)
    private String investorCode;

    @Column(name = "project_management_code", length = 100)
    private String projectManagementCode;

    @Column(name = "project_type_code", length = 100)
    private String projectTypeCode;
}
