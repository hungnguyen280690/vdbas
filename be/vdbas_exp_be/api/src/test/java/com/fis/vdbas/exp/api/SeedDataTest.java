package com.fis.vdbas.exp.api;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;

@SpringBootTest
@ActiveProfiles("test")
public class SeedDataTest {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Test
    void seedData() {
        System.out.println("Starting Database Seeding...");

        try {
            // Treasury
            jdbcTemplate.execute("INSERT INTO COMMON_TREASURY (TREASURY_CODE, TREASURY_NAME, STATUS, CREATED_BY, CREATED_DATE, UPDATED_BY, UPDATED_DATE) " +
                    "SELECT '0012', N'Kho bạc nhà nước khu vực I - PGD số 12', 1, 'SYSTEM', SYSDATE, 'SYSTEM', SYSDATE " +
                    "FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM COMMON_TREASURY WHERE TREASURY_CODE = '0012')");

            // Organization (thay thế INVESTOR + PROJECT_MANAGEMENT)
            jdbcTemplate.execute("INSERT INTO COMMON_ORGANIZATION (ORGANIZATION_CODE, ORGANIZATION_NAME, STATUS, CREATED_BY, CREATED_DATE, UPDATED_BY, UPDATED_DATE) " +
                    "SELECT 'BV_BACH_MAI', N'Bệnh viện Bạch Mai', 1, 'SYSTEM', SYSDATE, 'SYSTEM', SYSDATE " +
                    "FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM COMMON_ORGANIZATION WHERE ORGANIZATION_CODE = 'BV_BACH_MAI')");
            jdbcTemplate.execute("INSERT INTO COMMON_ORGANIZATION (ORGANIZATION_CODE, ORGANIZATION_NAME, STATUS, CREATED_BY, CREATED_DATE, UPDATED_BY, UPDATED_DATE) " +
                    "SELECT 'BQP', N'Bộ Quốc Phòng', 1, 'SYSTEM', SYSDATE, 'SYSTEM', SYSDATE " +
                    "FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM COMMON_ORGANIZATION WHERE ORGANIZATION_CODE = 'BQP')");

            // Status
            jdbcTemplate.execute("INSERT INTO COMMON_STATUS (STATUS_CODE, STATUS_NAME, SUB_SYSTEM, STATUS, CREATED_BY, CREATED_DATE, UPDATED_BY, UPDATED_DATE) " +
                    "SELECT 'DRAFT', N'Chưa hoàn thiện', 'EXP', 1, 'SYSTEM', SYSDATE, 'SYSTEM', SYSDATE " +
                    "FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM COMMON_STATUS WHERE STATUS_CODE = 'DRAFT')");
            jdbcTemplate.execute("INSERT INTO COMMON_STATUS (STATUS_CODE, STATUS_NAME, SUB_SYSTEM, STATUS, CREATED_BY, CREATED_DATE, UPDATED_BY, UPDATED_DATE) " +
                    "SELECT 'PENDING_CHECK', N'Chờ kiểm soát', 'EXP', 1, 'SYSTEM', SYSDATE, 'SYSTEM', SYSDATE " +
                    "FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM COMMON_STATUS WHERE STATUS_CODE = 'PENDING_CHECK')");
            jdbcTemplate.execute("INSERT INTO COMMON_STATUS (STATUS_CODE, STATUS_NAME, SUB_SYSTEM, STATUS, CREATED_BY, CREATED_DATE, UPDATED_BY, UPDATED_DATE) " +
                    "SELECT 'APPROVED', N'Hoàn thành xử lý', 'EXP', 1, 'SYSTEM', SYSDATE, 'SYSTEM', SYSDATE " +
                    "FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM COMMON_STATUS WHERE STATUS_CODE = 'APPROVED')");

            // Data Source
            jdbcTemplate.execute("INSERT INTO EXP_DATA_SOURCE (DATA_SOURCE_CODE, DATA_SOURCE_NAME, STATUS, CREATED_BY, CREATED_DATE, UPDATED_BY, UPDATED_DATE) " +
                    "SELECT 'MANUAL', N'Nhập tay', 1, 'SYSTEM', SYSDATE, 'SYSTEM', SYSDATE " +
                    "FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM EXP_DATA_SOURCE WHERE DATA_SOURCE_CODE = 'MANUAL')");

            // Workflow
            jdbcTemplate.execute("INSERT INTO EXP_WORKFLOW (WORKFLOW_CODE, WORKFLOW_NAME, STATUS, CREATED_BY, CREATED_DATE, UPDATED_BY, UPDATED_DATE) " +
                    "SELECT 'CAPEX_STANDARD', N'Luồng phê duyệt CAPEX chuẩn', 1, 'SYSTEM', SYSDATE, 'SYSTEM', SYSDATE " +
                    "FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM EXP_WORKFLOW WHERE WORKFLOW_CODE = 'CAPEX_STANDARD')");

            // Dossier Type
            jdbcTemplate.execute("INSERT INTO EXP_DOSSIER_TYPE (DOSSIER_TYPE_CODE, DOSSIER_TYPE_NAME, STATUS, CREATED_BY, CREATED_DATE, UPDATED_BY, UPDATED_DATE) " +
                    "SELECT 'CAPEX', N'Chi đầu tư', 1, 'SYSTEM', SYSDATE, 'SYSTEM', SYSDATE " +
                    "FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM EXP_DOSSIER_TYPE WHERE DOSSIER_TYPE_CODE = 'CAPEX')");
            jdbcTemplate.execute("INSERT INTO EXP_DOSSIER_TYPE (DOSSIER_TYPE_CODE, DOSSIER_TYPE_NAME, STATUS, CREATED_BY, CREATED_DATE, UPDATED_BY, UPDATED_DATE) " +
                    "SELECT 'OPEX', N'Chi thường xuyên', 1, 'SYSTEM', SYSDATE, 'SYSTEM', SYSDATE " +
                    "FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM EXP_DOSSIER_TYPE WHERE DOSSIER_TYPE_CODE = 'OPEX')");

            // Project Types
            jdbcTemplate.execute("INSERT INTO EXP_PROJECT_TYPE (PROJECT_TYPE_CODE, PROJECT_TYPE_NAME, STATUS, CREATED_BY, CREATED_DATE, UPDATED_BY, UPDATED_DATE) " +
                    "SELECT 'NORMAL', N'Thường', 1, 'SYSTEM', SYSDATE, 'SYSTEM', SYSDATE " +
                    "FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM EXP_PROJECT_TYPE WHERE PROJECT_TYPE_CODE = 'NORMAL')");
            jdbcTemplate.execute("INSERT INTO EXP_PROJECT_TYPE (PROJECT_TYPE_CODE, PROJECT_TYPE_NAME, STATUS, CREATED_BY, CREATED_DATE, UPDATED_BY, UPDATED_DATE) " +
                    "SELECT 'SPECIAL', N'Đặc thù', 1, 'SYSTEM', SYSDATE, 'SYSTEM', SYSDATE " +
                    "FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM EXP_PROJECT_TYPE WHERE PROJECT_TYPE_CODE = 'SPECIAL')");

            // Projects
            jdbcTemplate.execute("INSERT INTO EXP_PROJECT (PROJECT_CODE, PROJECT_NAME, PROJECT_TYPE_CODE, ORGANIZATION_CODE, STATUS, CREATED_BY, CREATED_DATE, UPDATED_BY, UPDATED_DATE) " +
                    "SELECT '7122155', N'Dự án nâng cấp bệnh viện Bạch Mai', 'NORMAL', 'BV_BACH_MAI', 1, 'SYSTEM', SYSDATE, 'SYSTEM', SYSDATE " +
                    "FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM EXP_PROJECT WHERE PROJECT_CODE = '7122155')");
            jdbcTemplate.execute("INSERT INTO EXP_PROJECT (PROJECT_CODE, PROJECT_NAME, PROJECT_TYPE_CODE, ORGANIZATION_CODE, STATUS, CREATED_BY, CREATED_DATE, UPDATED_BY, UPDATED_DATE) " +
                    "SELECT '7004686', N'Các dự án thuộc bộ quốc phòng', 'NORMAL', 'BQP', 1, 'SYSTEM', SYSDATE, 'SYSTEM', SYSDATE " +
                    "FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM EXP_PROJECT WHERE PROJECT_CODE = '7004686')");

        } catch (Exception e) {
            System.err.println("Error occurred during seeding: " + e.getMessage());
        }

        System.out.println("Database Seeding Step Finished.");
    }
}
