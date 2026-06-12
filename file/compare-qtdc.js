const oracledb = require('oracledb');
const fs = require('fs');

const config = {
    user: process.env.DB_USER || 'vdbas_qtdc',
    password: process.env.DB_PASSWORD || 'qttt@123',
    connectString: `${process.env.DB_HOST || '172.16.5.20'}:${process.env.DB_PORT || '1521'}/${process.env.DB_NAME || 'vdbaspdb'}`,
    ddlAuto: process.env.DB_DDL_AUTO || 'validate'
};

const sqlFilePath = process.argv[2] || './QTDC.sql';

if (!fs.existsSync(sqlFilePath)) {
    console.error('LOI: Khong tim thay file SQL tai ' + sqlFilePath);
    process.exit(1);
}

async function run() {
    let connection;
    try {
        console.log('--- BAT DAU SO SANH (QTDC) ---');
        console.log('File SQL: ' + sqlFilePath);
        const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');

        // 1. Parse SQL
        const sqlTables = {};
        const sqlPKs = [];
        const sqlUKs = [];
        const sqlFKs = [];

        const createTableRegex = /CREATE\s+TABLE\s+([a-zA-Z0-9_.]+)\s*\(([\s\S]*?)\)\s*;/gi;
        let match;
        while ((match = createTableRegex.exec(sqlContent)) !== null) {
            let tableName = match[1].toUpperCase();
            if (tableName.includes('.')) {
                tableName = tableName.split('.')[1];
            }
            tableName = tableName.replace(/"/g, '');

            const columnsContent = match[2];
            const columns = {};
            let currentPos = 0, parenLevel = 0, start = 0;
            const definitions = [];
            while (currentPos < columnsContent.length) {
                const char = columnsContent[currentPos];
                if (char === '(') parenLevel++;
                else if (char === ')') parenLevel--;
                else if (char === ',' && parenLevel === 0) {
                    definitions.push(columnsContent.substring(start, currentPos).trim());
                    start = currentPos + 1;
                }
                currentPos++;
            }
            definitions.push(columnsContent.substring(start).trim());

            for (const def of definitions) {
                if (!def) continue;
                const upperDef = def.toUpperCase();

                // Check for inline constraints
                if (upperDef.includes('PRIMARY KEY')) {
                    const pkMatch = def.match(/CONSTRAINT\s+([a-zA-Z0-9_]+)\s+PRIMARY\s+KEY/i);
                    if (pkMatch) sqlPKs.push(pkMatch[1].toUpperCase());
                    if (upperDef.startsWith('CONSTRAINT') || upperDef.startsWith('PRIMARY KEY')) continue;
                }
                if (upperDef.includes('UNIQUE')) {
                    const ukMatch = def.match(/CONSTRAINT\s+([a-zA-Z0-9_]+)\s+UNIQUE/i);
                    if (ukMatch) sqlUKs.push(ukMatch[1].toUpperCase());
                    if (upperDef.startsWith('CONSTRAINT') || upperDef.startsWith('UNIQUE')) continue;
                }
                if (upperDef.includes('FOREIGN KEY')) {
                    const fkMatch = def.match(/CONSTRAINT\s+([a-zA-Z0-9_]+)\s+FOREIGN\s+KEY/i);
                    if (fkMatch) sqlFKs.push(fkMatch[1].toUpperCase());
                    if (upperDef.startsWith('CONSTRAINT') || upperDef.startsWith('FOREIGN KEY')) continue;
                }
                if (upperDef.startsWith('CHECK')) continue;

                // Column definition
                const colParts = def.trim().split(/\s+/);
                const colName = colParts[0].toUpperCase().replace(/"/g, '');
                const colType = colParts[1] ? colParts[1].toUpperCase() : 'UNKNOWN';
                if (colName && !['CONSTRAINT', 'PRIMARY', 'UNIQUE', 'FOREIGN', 'CHECK'].includes(colName)) {
                    columns[colName] = colType;
                }
            }
            sqlTables[tableName] = columns;
        }

        // Also check for ALTER TABLE ADD CONSTRAINT
        const pkRegex = /ADD\s+CONSTRAINT\s+([a-zA-Z0-9_]+)\s+PRIMARY\s+KEY/gi;
        while ((match = pkRegex.exec(sqlContent)) !== null) sqlPKs.push(match[1].toUpperCase());

        const ukRegex = /ADD\s+CONSTRAINT\s+([a-zA-Z0-9_]+)\s+UNIQUE/gi;
        while ((match = ukRegex.exec(sqlContent)) !== null) sqlUKs.push(match[1].toUpperCase());

        const fkRegex = /ADD\s+\(CONSTRAINT\s+([a-zA-Z0-9_]+)\s+FOREIGN\s+KEY/gi;
        while ((match = fkRegex.exec(sqlContent)) !== null) sqlFKs.push(match[1].toUpperCase());

        // 2. Connect DB
        console.log('Ket noi Database: ' + config.connectString + '...');
        connection = await oracledb.getConnection(config);

        // 3. Fetch DB Data
        const dbTables = {};
        const colRes = await connection.execute("SELECT TABLE_NAME, COLUMN_NAME, DATA_TYPE FROM USER_TAB_COLUMNS WHERE TABLE_NAME NOT LIKE 'BIN$%'");
        for (const row of colRes.rows) {
            if (!dbTables[row[0]]) dbTables[row[0]] = {};
            dbTables[row[0]][row[1]] = row[2];
        }

        const dbPKs = [], dbUKs = [], dbFKs = [];
        const consRes = await connection.execute("SELECT CONSTRAINT_NAME, CONSTRAINT_TYPE FROM USER_CONSTRAINTS WHERE TABLE_NAME NOT LIKE 'BIN$%'");
        for (const row of consRes.rows) {
            if (row[1] === 'P') dbPKs.push(row[0]);
            else if (row[1] === 'U') dbUKs.push(row[0]);
            else if (row[1] === 'R') dbFKs.push(row[0]);
        }

        // 4. Report Detailed Results
        let hasError = false;

        console.log('\n[1. KIEM TRA BANG (TABLES)]');
        const sqlTableNames = Object.keys(sqlTables);
        const missingTables = sqlTableNames.filter(t => !dbTables[t]);
        if (missingTables.length > 0) {
            console.log('X LOI: Thieu ' + missingTables.length + ' bang trong DB:');
            missingTables.forEach(t => console.log('  - ' + t));
            hasError = true;
        } else {
            console.log('V Thanh cong: Tat ca ' + sqlTableNames.length + ' bang deu ton tai.');
        }

        console.log('\n[2. KIEM TRA COT (COLUMNS)]');
        let colErrorCount = 0;
        for (const t of sqlTableNames) {
            if (dbTables[t]) {
                const sqlCols = Object.keys(sqlTables[t]);
                const missingCols = sqlCols.filter(c => !dbTables[t][c]);
                if (missingCols.length > 0) {
                    console.log('X LOI: Bang ' + t + ' thieu cot: ' + missingCols.join(', '));
                    colErrorCount++;
                    hasError = true;
                }
            }
        }
        if (colErrorCount === 0) console.log('V Thanh cong: Tat ca cac cot deu khop.');

        console.log('\n[3. KIEM TRA RANG BUOC (CONSTRAINTS)]');
        const checkCons = (name, sqlList, dbList) => {
            const missing = sqlList.filter(c => !dbList.includes(c));
            if (missing.length > 0) {
                console.log('X LOI: Thieu ' + name + ': ' + missing.join(', '));
                hasError = true;
            } else {
                console.log('V Thanh cong: Khop ' + sqlList.length + ' ' + name + '.');
            }
        };
        checkCons('Khoa chinh (PK)', sqlPKs, dbPKs);
        checkCons('Rang buoc Duy nhat (UK)', sqlUKs, dbUKs);
        checkCons('Khoa ngoai (FK)', sqlFKs, dbFKs);

        console.log('\n--- KET LUAN CUOI CUNG ---');
        if (!hasError) {
            console.log('===> DATABASE HOAN TOAN KHOP VOI FILE SQL <===');
        } else {
            console.log('===> DATABASE CO SU KHAC BIET (XEM CHI TIET PHIA TREN) <===');
        }

    } catch (err) {
        console.error('\nERROR: ' + err.message);
    } finally {
        if (connection) await connection.close();
    }
}
run();
