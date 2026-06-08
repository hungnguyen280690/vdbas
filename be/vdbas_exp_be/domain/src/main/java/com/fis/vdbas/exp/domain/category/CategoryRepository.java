package com.fis.vdbas.exp.domain.category;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface CategoryRepository extends JpaRepository<Category, UUID>, JpaSpecificationExecutor<Category> {
    @Modifying
    @Query("UPDATE Category e SET e.deleted = 1, e.endDate = CURRENT_TIMESTAMP WHERE e.id = :id")
    void softDelete(@Param("id") UUID id);

    @Modifying
    @Query("UPDATE Category e SET e.deleted = 1, e.endDate = CURRENT_TIMESTAMP WHERE e.groupCode = :groupCode")
    void softDeleteByGroupCode(@Param("groupCode") String groupCode);

    List<Category> findByGroupCodeAndDeleted(String groupCode, Integer deleted);

    boolean existsByGroupCodeAndItemCodeAndDeleted(String groupCode, String itemCode, Integer deleted);
}
