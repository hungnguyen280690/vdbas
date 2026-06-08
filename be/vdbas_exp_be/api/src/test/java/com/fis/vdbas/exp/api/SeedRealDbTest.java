package com.fis.vdbas.exp.api;

import com.fis.vdbas.exp.domain.category.Category;
import com.fis.vdbas.exp.domain.category.CategoryGroup;
import com.fis.vdbas.exp.domain.category.CategoryGroupRepository;
import com.fis.vdbas.exp.domain.category.CategoryRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;

import java.time.LocalDateTime;

@SpringBootTest
public class SeedRealDbTest {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private CategoryGroupRepository categoryGroupRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    @Test
    public void seedMissingStates() {
        System.out.println("=== SEEDING MISSING STATES INTO REAL ORACLE DB ===");
        try {
            String[] sqls = {
                "INSERT INTO COMMON_STATE (STATE_CODE, STATE_NAME) SELECT 'DELETED', 'Đã xóa' FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM COMMON_STATE WHERE STATE_CODE = 'DELETED')",
                "INSERT INTO COMMON_STATE (STATE_CODE, STATE_NAME) SELECT 'CHECK_REJECTED', 'Từ chối kiểm soát' FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM COMMON_STATE WHERE STATE_CODE = 'CHECK_REJECTED')",
                "INSERT INTO COMMON_STATE (STATE_CODE, STATE_NAME) SELECT 'CHECK_CANCELLED', 'Hủy kiểm soát' FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM COMMON_STATE WHERE STATE_CODE = 'CHECK_CANCELLED')",
                "INSERT INTO COMMON_STATE (STATE_CODE, STATE_NAME) SELECT 'APPROVE_REJECTED', 'Từ chối phê duyệt' FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM COMMON_STATE WHERE STATE_CODE = 'APPROVE_REJECTED')",
                "INSERT INTO COMMON_STATE (STATE_CODE, STATE_NAME) SELECT 'APPROVE_CANCELLED', 'Hủy phê duyệt' FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM COMMON_STATE WHERE STATE_CODE = 'APPROVE_CANCELLED')"
            };
            
            for (String sql : sqls) {
                jdbcTemplate.execute(sql);
                System.out.println("Executed: " + sql);
            }
            System.out.println("Seeding completed successfully!");
        } catch (Exception e) {
            System.err.println("Error seeding database: " + e.getMessage());
            e.printStackTrace();
        }
    }

    @Test
    public void seedCategoryGroupsAndItems() {
        System.out.println("=== SEEDING CATEGORY GROUPS AND ITEMS INTO REAL ORACLE DB ===");
        try {
            // Seed Group CAT001
            if (!categoryGroupRepository.existsById("CAT001")) {
                CategoryGroup group1 = new CategoryGroup();
                group1.setGroupCode("CAT001");
                group1.setGroupName("Mock Category Group 1");
                group1.setSystem(0);
                group1.setActive(1);
                group1.setDeleted(0);
                categoryGroupRepository.save(group1);
                System.out.println("Seeded group CAT001");
            }

            // Seed Group CAT002
            if (!categoryGroupRepository.existsById("CAT002")) {
                CategoryGroup group2 = new CategoryGroup();
                group2.setGroupCode("CAT002");
                group2.setGroupName("Mock Category Group 2");
                group2.setSystem(0);
                group2.setActive(1);
                group2.setDeleted(0);
                categoryGroupRepository.save(group2);
                System.out.println("Seeded group CAT002");
            }

            // Seed some default items for CAT001 if they don't exist
            if (!categoryRepository.existsByGroupCodeAndItemCodeAndDeleted("CAT001", "ITEM_P_001", 0)) {
                Category parent = new Category();
                parent.setGroupCode("CAT001");
                parent.setItemCode("ITEM_P_001");
                parent.setItemName("Parent Category Item");
                parent.setCatLevel(1);
                parent.setCatPath("ITEM_P_001");
                parent.setOrderIndex(1);
                parent.setStartDate(LocalDateTime.now());
                parent.setDeleted(0);
                parent = categoryRepository.save(parent);
                System.out.println("Seeded parent category ITEM_P_001 with ID: " + parent.getId());

                Category child = new Category();
                child.setGroupCode("CAT001");
                child.setItemCode("ITEM_C_001");
                child.setItemName("Child Category Item");
                child.setParentId(parent.getId());
                child.setCatLevel(2);
                child.setCatPath("ITEM_P_001/ITEM_C_001");
                child.setOrderIndex(1);
                child.setStartDate(LocalDateTime.now());
                child.setDeleted(0);
                categoryRepository.save(child);
                System.out.println("Seeded child category ITEM_C_001");
            }

            System.out.println("Category seeding completed successfully!");
        } catch (Exception e) {
            System.err.println("Error seeding category data: " + e.getMessage());
            e.printStackTrace();
        }
    }
}
