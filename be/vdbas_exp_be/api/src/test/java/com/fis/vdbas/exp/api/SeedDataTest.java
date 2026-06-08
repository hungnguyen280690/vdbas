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
            // 0. Base Data
            jdbcTemplate.execute("INSERT INTO COMMON_BANK (BANK_CODE, BANK_NAME) " +
                    "SELECT 'VDB_BANK', 'Ngân hàng VDB' FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM COMMON_BANK WHERE BANK_CODE = 'VDB_BANK')");
            jdbcTemplate.execute("INSERT INTO COMMON_BANK (BANK_CODE, BANK_NAME) " +
                    "SELECT 'BQP_BANK', 'Ngân hàng BQP' FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM COMMON_BANK WHERE BANK_CODE = 'BQP_BANK')");

            jdbcTemplate.execute("INSERT INTO COMMON_TREASURY (TREASURY_CODE, TREASURY_NAME) " +
                    "SELECT 'VDB_TREASURY', 'Kho bạc VDB' FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM COMMON_TREASURY WHERE TREASURY_CODE = 'VDB_TREASURY')");
            jdbcTemplate.execute("INSERT INTO COMMON_TREASURY (TREASURY_CODE, TREASURY_NAME) " +
                    "SELECT 'BQP_TREASURY', 'Kho bạc BQP' FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM COMMON_TREASURY WHERE TREASURY_CODE = 'BQP_TREASURY')");
            jdbcTemplate.execute("INSERT INTO COMMON_TREASURY (TREASURY_CODE, TREASURY_NAME) " +
                    "SELECT '0012', 'Kho bạc nhà nước khu vực I - PGD số 12' FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM COMMON_TREASURY WHERE TREASURY_CODE = '0012')");

            jdbcTemplate.execute("INSERT INTO EXP_DATA_SOURCE (DATA_SOURCE_CODE, DATA_SOURCE_NAME) " +
                    "SELECT 'MANUAL', 'Nhập tay' FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM EXP_DATA_SOURCE WHERE DATA_SOURCE_CODE = 'MANUAL')");

            jdbcTemplate.execute("INSERT INTO COMMON_STATE (STATE_CODE, STATE_NAME) " +
                    "SELECT 'DRAFT', 'Dự thảo' FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM COMMON_STATE WHERE STATE_CODE = 'DRAFT')");
            jdbcTemplate.execute("INSERT INTO COMMON_STATE (STATE_CODE, STATE_NAME) " +
                    "SELECT 'PENDING_CHECK', 'Chờ kiểm soát' FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM COMMON_STATE WHERE STATE_CODE = 'PENDING_CHECK')");
            jdbcTemplate.execute("INSERT INTO COMMON_STATE (STATE_CODE, STATE_NAME) " +
                    "SELECT 'CHECK_REJECTED', 'Từ chối kiểm soát' FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM COMMON_STATE WHERE STATE_CODE = 'CHECK_REJECTED')");
            jdbcTemplate.execute("INSERT INTO COMMON_STATE (STATE_CODE, STATE_NAME) " +
                    "SELECT 'CHECK_CANCELLED', 'Hủy kiểm soát' FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM COMMON_STATE WHERE STATE_CODE = 'CHECK_CANCELLED')");
            jdbcTemplate.execute("INSERT INTO COMMON_STATE (STATE_CODE, STATE_NAME) " +
                    "SELECT 'PENDING_APPROVE', 'Chờ phê duyệt' FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM COMMON_STATE WHERE STATE_CODE = 'PENDING_APPROVE')");
            jdbcTemplate.execute("INSERT INTO COMMON_STATE (STATE_CODE, STATE_NAME) " +
                    "SELECT 'APPROVE_REJECTED', 'Từ chối phê duyệt' FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM COMMON_STATE WHERE STATE_CODE = 'APPROVE_REJECTED')");
            jdbcTemplate.execute("INSERT INTO COMMON_STATE (STATE_CODE, STATE_NAME) " +
                    "SELECT 'APPROVE_CANCELLED', 'Hủy phê duyệt' FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM COMMON_STATE WHERE STATE_CODE = 'APPROVE_CANCELLED')");
            jdbcTemplate.execute("INSERT INTO COMMON_STATE (STATE_CODE, STATE_NAME) " +
                    "SELECT 'APPROVED', 'Đã phê duyệt' FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM COMMON_STATE WHERE STATE_CODE = 'APPROVED')");
            jdbcTemplate.execute("INSERT INTO COMMON_STATE (STATE_CODE, STATE_NAME) " +
                    "SELECT 'DELETED', 'Đã xóa' FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM COMMON_STATE WHERE STATE_CODE = 'DELETED')");

            jdbcTemplate.execute("INSERT INTO EXP_WORKFLOW (WORKFLOW_ID, WORKFLOW_NAME) " +
                    "SELECT 1, 'Quy trình CAPEX' FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM EXP_WORKFLOW WHERE WORKFLOW_ID = 1)");

            // 1. Project Types
            jdbcTemplate.execute("INSERT INTO EXP_PROJECT_TYPE (PROJECT_TYPE_CODE, PROJECT_TYPE_NAME) " +
                    "SELECT 'Citizen', 'Dự án dân dụng' FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM EXP_PROJECT_TYPE WHERE PROJECT_TYPE_CODE = 'Citizen')");
            
            jdbcTemplate.execute("INSERT INTO EXP_PROJECT_TYPE (PROJECT_TYPE_CODE, PROJECT_TYPE_NAME) " +
                    "SELECT 'Military', 'Dự án quân sự' FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM EXP_PROJECT_TYPE WHERE PROJECT_TYPE_CODE = 'Military')");

            // 2. Project Management
            jdbcTemplate.execute("INSERT INTO EXP_PROJECT_MANAGEMENT (PROJECT_MANAGEMENT_CODE, PROJECT_MANAGEMENT_NAME) " +
                    "SELECT '3029123', 'BQLDA bệnh viện Bạch Mai' FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM EXP_PROJECT_MANAGEMENT WHERE PROJECT_MANAGEMENT_CODE = '3029123')");
            
            jdbcTemplate.execute("INSERT INTO EXP_PROJECT_MANAGEMENT (PROJECT_MANAGEMENT_CODE, PROJECT_MANAGEMENT_NAME) " +
                    "SELECT '1059227', 'BQL Cục thông tin BQP' FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM EXP_PROJECT_MANAGEMENT WHERE PROJECT_MANAGEMENT_CODE = '1059227')");

            // 2.1 Investors (Found via constraint R_48)
            jdbcTemplate.execute("INSERT INTO EXP_INVESTOR (INVESTOR_CODE, INVESTOR_NAME, DOMESTIC_BANK_CODE, DOMESTIC_TREASURY_CODE) " +
                    "SELECT 'VDB', 'Ngân hàng Phát triển Việt Nam', 'VDB_BANK', 'VDB_TREASURY' FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM EXP_INVESTOR WHERE INVESTOR_CODE = 'VDB')");
            
            jdbcTemplate.execute("INSERT INTO EXP_INVESTOR (INVESTOR_CODE, INVESTOR_NAME, DOMESTIC_BANK_CODE, DOMESTIC_TREASURY_CODE) " +
                    "SELECT 'BQP', 'Bộ Quốc Phòng', 'BQP_BANK', 'BQP_TREASURY' FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM EXP_INVESTOR WHERE INVESTOR_CODE = 'BQP')");

            // 3. Projects
            jdbcTemplate.execute("INSERT INTO EXP_PROJECT (PROJECT_CODE, PROJECT_NAME, PROJECT_TYPE_CODE, PROJECT_MANAGEMENT_CODE, INVESTOR_CODE) " +
                    "SELECT '7122155', 'Dự án nâng cấp bệnh viện Bạch Mai', 'Citizen', '3029123', 'VDB' " +
                    "FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM EXP_PROJECT WHERE PROJECT_CODE = '7122155')");
            
            jdbcTemplate.execute("INSERT INTO EXP_PROJECT (PROJECT_CODE, PROJECT_NAME, PROJECT_TYPE_CODE, PROJECT_MANAGEMENT_CODE, INVESTOR_CODE) " +
                    "SELECT '7004686', 'Các dự án thuộc dự án bộ quốc phòng', 'Military', '1059227', 'BQP' " +
                    "FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM EXP_PROJECT WHERE PROJECT_CODE = '7004686')");

        } catch (Exception e) {
            System.err.println("Error occurred during seeding: " + e.getMessage());
        }

        try {
            System.out.println("--- Debugging Constraints ---");
            
            // Debug EXP_PROJECT
            System.out.println("[EXP_PROJECT]");
            jdbcTemplate.query("SELECT a.constraint_name, a.column_name, c.r_constraint_name " +
                    "FROM user_cons_columns a " +
                    "JOIN user_constraints c ON a.constraint_name = c.constraint_name " +
                    "WHERE c.table_name = 'EXP_PROJECT'", (rs, rowNum) -> {
                System.out.println("Constraint: " + rs.getString("constraint_name") + 
                                   ", Column: " + rs.getString("column_name") + 
                                   ", R_Constraint: " + rs.getString("r_constraint_name"));
                return null;
            });

            // Debug EXP_INVESTOR
            System.out.println("[EXP_INVESTOR]");
            jdbcTemplate.query("SELECT a.constraint_name, a.column_name, c.r_constraint_name " +
                    "FROM user_cons_columns a " +
                    "JOIN user_constraints c ON a.constraint_name = c.constraint_name " +
                    "WHERE c.table_name = 'EXP_INVESTOR'", (rs, rowNum) -> {
                System.out.println("Constraint: " + rs.getString("constraint_name") + 
                                   ", Column: " + rs.getString("column_name") + 
                                   ", R_Constraint: " + rs.getString("r_constraint_name"));
                return null;
            });

            // Debug EXP_DOSSIER
            System.out.println("[EXP_DOSSIER]");
            jdbcTemplate.query("SELECT a.constraint_name, a.column_name, c.r_constraint_name " +
                    "FROM user_cons_columns a " +
                    "JOIN user_constraints c ON a.constraint_name = c.constraint_name " +
                    "WHERE c.table_name = 'EXP_DOSSIER'", (rs, rowNum) -> {
                System.out.println("Constraint: " + rs.getString("constraint_name") + 
                                   ", Column: " + rs.getString("column_name") + 
                                   ", R_Constraint: " + rs.getString("r_constraint_name"));
                return null;
            });
        } catch (Exception e) {
            System.err.println("Error occurred during constraint debugging (normal if not Oracle): " + e.getMessage());
        }

        System.out.println("Database Seeding Step Finished.");
    }
}
