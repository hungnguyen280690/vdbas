import oracledb, json

c = oracledb.connect(user='vdbas_exp_new_ai', password='vdbas_exp', dsn='172.16.5.20:1521/vdbaspdb')
cur = c.cursor()

cur.execute("select table_name from user_tables order by table_name")
tables = [r[0] for r in cur.fetchall()]

out = {}
for t in tables:
    cur.execute("""
        select column_name, data_type, data_length, data_precision, data_scale, nullable, data_default
        from user_tab_columns where table_name=:t order by column_id
    """, t=t)
    cols = []
    for cn, dt, dl, dp, ds, nl, dft in cur.fetchall():
        cols.append({"col": cn, "type": dt, "len": dl, "prec": dp, "scale": ds,
                     "null": nl, "default": (str(dft).strip() if dft else None)})
    # row count
    cur.execute(f'select count(*) from "{t}"')
    cnt = cur.fetchone()[0]
    out[t] = {"count": cnt, "cols": cols}

# foreign keys
cur.execute("""
    select ac.table_name, ac.constraint_name, acc.column_name, r.table_name r_table
    from user_constraints ac
    join user_cons_columns acc on ac.constraint_name=acc.constraint_name
    join user_constraints r on ac.r_constraint_name=r.constraint_name
    where ac.constraint_type='R' order by ac.table_name, ac.constraint_name, acc.position
""")
fks = {}
for tn, cnst, col, rt in cur.fetchall():
    fks.setdefault(tn, []).append({"fk": cnst, "col": col, "ref": rt})

print("##TABLES##")
for t in tables:
    info = out[t]
    print(f"\n=== {t}  (rows={info['count']}) ===")
    for col in info["cols"]:
        d = col
        typ = d['type']
        if d['prec'] is not None:
            typ += f"({d['prec']},{d['scale']})"
        elif d['len']:
            typ += f"({d['len']})"
        nn = "" if d['null']=='Y' else " NOT NULL"
        df = f" def={d['default']}" if d['default'] else ""
        print(f"   {d['col']:<28} {typ}{nn}{df}")
    if t in fks:
        for f in fks[t]:
            print(f"   FK {f['col']} -> {f['ref']}")
c.close()
