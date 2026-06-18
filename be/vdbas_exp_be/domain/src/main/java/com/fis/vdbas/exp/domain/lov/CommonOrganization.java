package com.fis.vdbas.exp.domain.lov;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

/** LOV Đơn vị quan hệ ngân sách — map bảng {@code COMMON_ORGANIZATION} (chỉ đọc). */
@Entity
@Table(name = "COMMON_ORGANIZATION")
@Getter
@Setter
@ToString
@NoArgsConstructor
public class CommonOrganization {

    @Id
    @Column(name = "ORGANIZATION_CODE", length = 100)
    private String organizationCode;

    @Column(name = "ORGANIZATION_NAME", length = 500)
    private String organizationName;

    @Column(name = "STATUS")
    private Integer status;
}
