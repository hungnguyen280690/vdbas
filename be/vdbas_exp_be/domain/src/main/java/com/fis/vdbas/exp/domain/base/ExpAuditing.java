package com.fis.vdbas.exp.domain.base;

import com.fis.vdbas.common.domain.AbstractAuditing;
import jakarta.persistence.Column;
import jakarta.persistence.MappedSuperclass;
import lombok.Getter;
import lombok.Setter;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;

import java.time.LocalDateTime;

/**
 * Audit base cho các entity phân hệ EXP.
 *
 * <p>Các bảng EXP trên DB sống còn giữ cột audit legacy {@code CREATED_DATE}/{@code UPDATED_DATE}
 * (kiểu DATE, NOT NULL, không default) song song với {@code created_at}/{@code updated_at} của
 * {@link AbstractAuditing}. {@code ddl-auto=update} chỉ thêm cột mới chứ không gỡ cột cũ, nên mọi
 * insert qua app sẽ vi phạm NOT NULL nếu không ghi 2 cột legacy này.</p>
 *
 * <p>Lớp này map + để Spring Data JPA Auditing tự điền chúng (cùng cơ chế với created_at/updated_at).</p>
 */
@MappedSuperclass
@Getter
@Setter
public abstract class ExpAuditing<T> extends AbstractAuditing<T> {

    @CreatedDate
    @Column(name = "CREATED_DATE", updatable = false)
    private LocalDateTime createdDate;

    @LastModifiedDate
    @Column(name = "UPDATED_DATE")
    private LocalDateTime updatedDate;
}
