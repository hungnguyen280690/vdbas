package com.fis.vdbas.exp.api;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;

import java.util.List;
import java.util.Map;

@SpringBootTest
public class ConstraintTest {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Test
    public void findConstraintDetails() {
        System.out.println("=== QUERYING CONSTRAINT DETAILS FOR R_12 ===");
        try {
            String sql = "SELECT parent.table_name AS parent_table, child.table_name AS child_table, " +
                         "child.constraint_name, cols.column_name " +
                         "FROM user_constraints child " +
                         "JOIN user_constraints parent ON child.r_constraint_name = parent.constraint_name " +
                         "JOIN user_cons_columns cols ON child.constraint_name = cols.constraint_name " +
                         "WHERE child.constraint_name = 'R_12'";
            
            List<Map<String, Object>> results = jdbcTemplate.queryForList(sql);
            for (Map<String, Object> row : results) {
                System.out.println("FOUND R_12 details:");
                System.out.println("  Child Table:  " + row.get("CHILD_TABLE"));
                System.out.println("  Column:       " + row.get("COLUMN_NAME"));
                System.out.println("  Parent Table: " + row.get("PARENT_TABLE"));
            }
        } catch (Exception e) {
            System.err.println("Error running query: " + e.getMessage());
            e.printStackTrace();
        }
    }
}
