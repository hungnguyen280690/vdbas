package com.fis.vdbas.exp.domain.lov;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

/**
 * LOV Workflow — map bảng {@code EXP_WORKFLOW} (chỉ đọc).
 * <p>DEC-06: seed bản ghi {@code WORKFLOW_CODE = 'CAPEX_STANDARD'}.</p>
 */
@Entity
@Table(name = "EXP_WORKFLOW")
@Getter
@Setter
@ToString
@NoArgsConstructor
public class ExpWorkflow {

    @Id
    @Column(name = "WORKFLOW_CODE", length = 100)
    private String workflowCode;

    @Column(name = "WORKFLOW_NAME", length = 500)
    private String workflowName;

    @Column(name = "STATUS")
    private Integer status;
}
