const oracledb = require('oracledb');
const fs = require('fs');

const config = {
    user: process.env.DB_USER || 'vdbas_exp_new_ai',
    password: process.env.DB_PASSWORD || 'vdbas_exp',
    connectString: `${process.env.DB_HOST || '172.16.5.20'}:${process.env.DB_PORT || '1521'}/${process.env.DB_NAME || 'vdbaspdb'}`,
    ddlAuto: process.env.DB_DDL_AUTO || 'update'
};

const sqlFilePath = process.argv[2] || './DOSSIER.sql';

if (!fs.existsSync(sqlFilePath)) {
    console.error('LOI: Khong tim thay file SQL tai ' + sqlFilePath);
    process.exit(1);
}

// Strip semicolon at the end of DDL statements for Oracle execution
function cleanDDL(ddl) {
    return ddl.trim().replace(/;$/, '');
}

async function run() {
    let connection;
    try {
        console.log('=== CHUONG TRINH SO SANH & DONG BO SCHEMA (AI) ===');
        console.log('File SQL: ' + sqlFilePath);
        console.log('Che do DB_DDL_AUTO: ' + config.ddlAuto);
        console.log('Ket noi Database: ' + config.connectString + ' (User: ' + config.user + ')...');

        const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');

        // 1. Parse SQL File
        const sqlTables = {};
        const sqlTableDDLs = {};
        const sqlConstraints = {}; // constraintName -> { tableName, ddl, type: 'PK'|'UK'|'FK' }

        // Parse ALTER TABLE statements for constraints
        const alterTableRegex = /ALTER\s+TABLE\s+([a-zA-Z0-9_.]+)\s+ADD\s+([\s\S]*?);/gi;
        let match;
        while ((match = alterTableRegex.exec(sqlContent)) !== null) {
            let tableName = match[1].toUpperCase().replace(/"/g, '');
            if (tableName.includes('.')) tableName = tableName.split('.')[1];
            
            const addContent = match[2];
            const upperAddContent = addContent.toUpperCase();
            
            let constraintName = null;
            let type = null;
            
            if (upperAddContent.includes('PRIMARY KEY')) {
                type = 'PK';
                const pkMatch = addContent.match(/CONSTRAINT\s+([a-zA-Z0-9_]+)/i);
                if (pkMatch) constraintName = pkMatch[1].toUpperCase();
            } else if (upperAddContent.includes('UNIQUE')) {
                type = 'UK';
                const ukMatch = addContent.match(/CONSTRAINT\s+([a-zA-Z0-9_]+)/i);
                if (ukMatch) constraintName = ukMatch[1].toUpperCase();
            } else if (upperAddContent.includes('FOREIGN KEY')) {
                type = 'FK';
                const fkMatch = addContent.match(/CONSTRAINT\s+([a-zA-Z0-9_]+)/i);
                if (fkMatch) constraintName = fkMatch[1].toUpperCase();
            }
            
            if (constraintName) {
                sqlConstraints[constraintName] = {
                    tableName: tableName,
                    ddl: match[0],
                    type: type
                };
            }
        }

        // Parse CREATE TABLE statements
        const createTableRegex = /CREATE\s+TABLE\s+([a-zA-Z0-9_.]+)\s*\(([\s\S]*?)\)\s*;/gi;
        while ((match = createTableRegex.exec(sqlContent)) !== null) {
            let tableName = match[1].toUpperCase().replace(/"/g, '');
            if (tableName.includes('.')) tableName = tableName.split('.')[1];
            
            sqlTableDDLs[tableName] = match[0];
            
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

                // Skip inline constraint declarations if they are separate lines, 
                // but extract constraint names if declared inline
                if (upperDef.includes('PRIMARY KEY')) {
                    const pkMatch = def.match(/CONSTRAINT\s+([a-zA-Z0-9_]+)\s+PRIMARY\s+KEY/i);
                    if (pkMatch) {
                        const cn = pkMatch[1].toUpperCase();
                        sqlConstraints[cn] = { tableName, ddl: null, type: 'PK' };
                    }
                    if (upperDef.startsWith('CONSTRAINT') || upperDef.startsWith('PRIMARY KEY')) continue;
                }
                if (upperDef.includes('UNIQUE')) {
                    const ukMatch = def.match(/CONSTRAINT\s+([a-zA-Z0-9_]+)\s+UNIQUE/i);
                    if (ukMatch) {
                        const cn = ukMatch[1].toUpperCase();
                        sqlConstraints[cn] = { tableName, ddl: null, type: 'UK' };
                    }
                    if (upperDef.startsWith('CONSTRAINT') || upperDef.startsWith('UNIQUE')) continue;
                }
                if (upperDef.includes('FOREIGN KEY')) {
                    const fkMatch = def.match(/CONSTRAINT\s+([a-zA-Z0-9_]+)\s+FOREIGN\s+KEY/i);
                    if (fkMatch) {
                        const cn = fkMatch[1].toUpperCase();
                        sqlConstraints[cn] = { tableName, ddl: null, type: 'FK' };
                    }
                    if (upperDef.startsWith('CONSTRAINT') || upperDef.startsWith('FOREIGN KEY')) continue;
                }
                if (upperDef.startsWith('CHECK')) continue;

                // Column definition
                const colParts = def.trim().split(/\s+/);
                const colName = colParts[0].toUpperCase().replace(/"/g, '');
                if (colName && !['CONSTRAINT', 'PRIMARY', 'UNIQUE', 'FOREIGN', 'CHECK'].includes(colName)) {
                    const colDefPart = def.substring(def.indexOf(colParts[0]) + colParts[0].length).trim();
                    columns[colName] = {
                        type: colParts[1] ? colParts[1].toUpperCase() : 'UNKNOWN',
                        rawDef: def.trim(),
                        definitionOnly: colDefPart
                    };
                }
            }
            sqlTables[tableName] = columns;
        }

        // Separate SQL constraints into lists for reporting
        const sqlPKs = Object.keys(sqlConstraints).filter(c => sqlConstraints[c].type === 'PK');
        const sqlUKs = Object.keys(sqlConstraints).filter(c => sqlConstraints[c].type === 'UK');
        const sqlFKs = Object.keys(sqlConstraints).filter(c => sqlConstraints[c].type === 'FK');

        // 2. Connect to Oracle Database
        connection = await oracledb.getConnection(config);

        // Helper function to fetch current schema state from DB
        async function fetchDBSchema() {
            const dbTables = {};
            const colRes = await connection.execute("SELECT TABLE_NAME, COLUMN_NAME, DATA_TYPE FROM USER_TAB_COLUMNS WHERE TABLE_NAME NOT LIKE 'BIN$%'");
            for (const row of colRes.rows) {
                const tab = row[0].toUpperCase();
                const col = row[1].toUpperCase();
                const type = row[2].toUpperCase();
                if (!dbTables[tab]) dbTables[tab] = {};
                dbTables[tab][col] = type;
            }

            const dbPKs = [], dbUKs = [], dbFKs = [];
            const consRes = await connection.execute("SELECT CONSTRAINT_NAME, CONSTRAINT_TYPE FROM USER_CONSTRAINTS WHERE TABLE_NAME NOT LIKE 'BIN$%'");
            for (const row of consRes.rows) {
                const name = row[0].toUpperCase();
                const type = row[1];
                if (type === 'P') dbPKs.push(name);
                else if (type === 'U') dbUKs.push(name);
                else if (type === 'R') dbFKs.push(name);
            }

            return { dbTables, dbPKs, dbUKs, dbFKs };
        }

        // Perform comparison
        async function checkAndReport(dbSchema, silent = false) {
            const { dbTables, dbPKs, dbUKs, dbFKs } = dbSchema;
            let hasDiff = false;
            const diffs = {
                missingTables: [],
                missingColumns: [], // Array of { table, column, def }
                missingConstraints: [] // Array of { name, table, type, ddl }
            };

            const sqlTableNames = Object.keys(sqlTables);

            // 1. Check Tables
            const missingTables = sqlTableNames.filter(t => !dbTables[t]);
            if (missingTables.length > 0) {
                diffs.missingTables = missingTables;
                hasDiff = true;
                if (!silent) {
                    console.log('X LOI: Thieu ' + missingTables.length + ' bang trong DB:');
                    missingTables.forEach(t => console.log('  - ' + t));
                }
            } else if (!silent) {
                console.log('V Thanh cong: Tat ca ' + sqlTableNames.length + ' bang deu ton tai.');
            }

            // 2. Check Columns
            let colErrorCount = 0;
            for (const t of sqlTableNames) {
                if (dbTables[t]) {
                    const sqlCols = Object.keys(sqlTables[t]);
                    const missingCols = sqlCols.filter(c => !dbTables[t][c]);
                    if (missingCols.length > 0) {
                        missingCols.forEach(c => {
                            diffs.missingColumns.push({
                                table: t,
                                column: c,
                                def: sqlTables[t][c].definitionOnly
                            });
                        });
                        colErrorCount += missingCols.length;
                        hasDiff = true;
                        if (!silent) {
                            console.log('X LOI: Bang ' + t + ' thieu cot: ' + missingCols.join(', '));
                        }
                    }
                }
            }
            if (colErrorCount === 0 && !silent) {
                console.log('V Thanh cong: Tat ca cac cot deu khop.');
            }

            // 3. Check Constraints
            const checkCons = (name, typeLabel, sqlList, dbList) => {
                const missing = sqlList.filter(c => !dbList.includes(c));
                if (missing.length > 0) {
                    missing.forEach(c => {
                        const consInfo = sqlConstraints[c];
                        diffs.missingConstraints.push({
                            name: c,
                            table: consInfo ? consInfo.tableName : 'UNKNOWN',
                            type: typeLabel,
                            ddl: consInfo ? consInfo.ddl : null
                        });
                    });
                    hasDiff = true;
                    if (!silent) {
                        console.log('X LOI: Thieu ' + name + ': ' + missing.join(', '));
                    }
                } else if (!silent) {
                    console.log('V Thanh cong: Khop ' + sqlList.length + ' ' + name + '.');
                }
            };

            if (!silent) console.log('\n[Kiem tra Cac Rang buoc / Khoa (Constraints)]');
            checkCons('Khoa chinh (PK)', 'PK', sqlPKs, dbPKs);
            checkCons('Rang buoc Duy nhat (UK)', 'UK', sqlUKs, dbUKs);
            checkCons('Khoa ngoai (FK)', 'FK', sqlFKs, dbFKs);

            return { hasDiff, diffs };
        }

        console.log('\n--- BIEU DIEN SO SANH BAN DAU ---');
        let dbSchema = await fetchDBSchema();
        let { hasDiff, diffs } = await checkAndReport(dbSchema, false);

        if (!hasDiff) {
            console.log('\n===> KET LUAN: DATABASE DONG BO HOAN TOAN VOI FILE SQL <===');
            return;
        }

        console.log('\n===> DATABASE CO SU KHAC BIET VOI FILE SQL <===');

        // If update mode is enabled, try to sync the schema
        if (config.ddlAuto === 'update') {
            console.log('\n--- BAT DAU DONG BO HOA (DB_DDL_AUTO = update) ---');
            
            // Step A: Create Missing Tables
            if (diffs.missingTables.length > 0) {
                console.log('\n[Buoc 1: Tao cac bang bi thieu]');
                for (const t of diffs.missingTables) {
                    const ddl = sqlTableDDLs[t];
                    if (ddl) {
                        const cleaned = cleanDDL(ddl);
                        console.log(`Dang chay: CREATE TABLE ${t}...`);
                        try {
                            await connection.execute(cleaned);
                            console.log(`V Tao bang ${t} thanh cong.`);
                        } catch (err) {
                            console.error(`X LOI khi tao bang ${t}: ${err.message}`);
                        }
                    } else {
                        console.error(`X LOI: Khong tim thay DDL cho bang ${t} trong file SQL.`);
                    }
                }
            }

            // Fetch DB schema again in case tables were created (which creates their columns too)
            dbSchema = await fetchDBSchema();
            // Re-evaluate difference list
            let checkResult = await checkAndReport(dbSchema, true);
            diffs = checkResult.diffs;

            // Step B: Add Missing Columns
            if (diffs.missingColumns.length > 0) {
                console.log('\n[Buoc 2: Them cac cot bi thieu]');
                for (const colInfo of diffs.missingColumns) {
                    const alterSQL = `ALTER TABLE ${colInfo.table} ADD (${colInfo.column} ${colInfo.def})`;
                    console.log(`Dang chay: ${alterSQL}...`);
                    try {
                        await connection.execute(alterSQL);
                        console.log(`V Them cot ${colInfo.column} vao bang ${colInfo.table} thanh cong.`);
                    } catch (err) {
                        console.error(`X LOI khi them cot ${colInfo.column} vao bang ${colInfo.table}: ${err.message}`);
                    }
                }
            }

            // Fetch DB schema again
            dbSchema = await fetchDBSchema();
            checkResult = await checkAndReport(dbSchema, true);
            diffs = checkResult.diffs;

            // Step C: Add Missing Constraints
            if (diffs.missingConstraints.length > 0) {
                console.log('\n[Buoc 3: Them cac rang buoc (Constraints) bi thieu]');
                for (const consInfo of diffs.missingConstraints) {
                    if (consInfo.ddl) {
                        const cleaned = cleanDDL(consInfo.ddl);
                        console.log(`Dang chay: Them constraint ${consInfo.name} cho bang ${consInfo.table}...`);
                        try {
                            await connection.execute(cleaned);
                            console.log(`V Them constraint ${consInfo.name} thanh cong.`);
                        } catch (err) {
                            console.error(`X LOI khi them constraint ${consInfo.name}: ${err.message}`);
                        }
                    } else {
                        console.warn(`X CANH BAO: Khong co DDL duoc dinh nghia cho constraint ${consInfo.name}.`);
                    }
                }
            }

            // Final Verification
            console.log('\n--- TIEN HANH XAC MINH LAI SAU KHI UPDATE ---');
            dbSchema = await fetchDBSchema();
            const finalCheck = await checkAndReport(dbSchema, false);
            if (!finalCheck.hasDiff) {
                console.log('\n===> KET LUAN SAU CUNG: DONG BO HOA THANH CONG! DATABASE DA DONG BO VOI FILE SQL <===');
            } else {
                console.log('\n===> KET LUAN SAU CUNG: DONG BO HOA THAT BAI HOAC CO LOI XAY RA (XEM CHI TIET PHIA TREN) <===');
            }
        } else {
            console.log('\n[Thong bao] DB_DDL_AUTO khong phai la "update". Khong thuc hien cap nhat tu dong.');
        }

    } catch (err) {
        console.error('\nERROR: ' + err.message);
    } finally {
        if (connection) {
            try {
                await connection.close();
            } catch (err) {
                console.error('Error closing connection: ' + err.message);
            }
        }
    }
}

run();
