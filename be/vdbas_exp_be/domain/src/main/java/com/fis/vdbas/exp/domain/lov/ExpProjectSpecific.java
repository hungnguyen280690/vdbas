package com.fis.vdbas.exp.domain.lov;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

/** LOV Dự án đặc thù — map bảng {@code EXP_PROJECT_SPECIFIC} (chỉ đọc). */
@Entity
@Table(name = "EXP_PROJECT_SPECIFIC")
@Getter
@Setter
@ToString
@NoArgsConstructor
public class ExpProjectSpecific {

    @Id
    @Column(name = "PROJECT_SPECIFIC_CODE", length = 100)
    private String projectSpecificCode;

    @Column(name = "PROJECT_SPECIFIC_NAME", length = 500)
    private String projectSpecificName;

    @Column(name = "PROJECT_CODE", length = 100)
    private String projectCode;

    @Column(name = "STATUS")
    private Integer status;
}
