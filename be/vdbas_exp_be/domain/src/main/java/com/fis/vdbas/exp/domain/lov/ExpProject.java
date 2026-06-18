package com.fis.vdbas.exp.domain.lov;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import org.hibernate.annotations.Formula;

/**
 * LOV Dự án/Công trình — map bảng {@code EXP_PROJECT} (chỉ đọc).
 * <p>NOTE-02: {@code hasSpecific} tính bằng {@code @Formula} (EXISTS trong EXP_PROJECT_SPECIFIC).</p>
 */
@Entity
@Table(name = "EXP_PROJECT")
@Getter
@Setter
@ToString
@NoArgsConstructor
public class ExpProject {

    @Id
    @Column(name = "PROJECT_CODE", length = 100)
    private String projectCode;

    @Column(name = "PROJECT_NAME", length = 500)
    private String projectName;

    @Column(name = "PROJECT_TYPE_CODE", length = 100)
    private String projectTypeCode;

    @Column(name = "ORGANIZATION_CODE", length = 100)
    private String organizationCode;

    @Column(name = "STATUS")
    private Integer status;

    @Formula("(CASE WHEN EXISTS (SELECT 1 FROM EXP_PROJECT_SPECIFIC s "
            + "WHERE s.PROJECT_CODE = PROJECT_CODE AND s.STATUS = 1) THEN 1 ELSE 0 END)")
    private Integer hasSpecific;
}
