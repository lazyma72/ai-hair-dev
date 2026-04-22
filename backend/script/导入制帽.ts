import { ObjectId } from "mongodb"
import { Global } from "../src/models/Global"
import { Db制帽 } from "../src/shared/db/Db制帽"

const txt = `
P-001	雪花网	
P-002	侧分雪花网（0.12网）	
P-002A	侧分雪花网(0.10网WB色）	
P-003	MONO网+4点硅胶	
P-004	13*6胶纸网	
P-005	13*3.5（尾魔术贴）	
P-006	雪花网L码有尾
P-007	韩国MONO	
P-008	水溶胶纸帽网	
P-009	13*6拱形网帽	HD-2030网
P-009A	13*6拱形网帽(调节带改为竖车）	HD-2030网
P-010	13*6拱形网帽尾蕾丝	HD-2030网
P-011	13*4拱形网帽	HD-2030网
P-012	13*6弹力网S码	
P-013	机制网帽	3片网有耳有尾
P-014	6.5圆配件	弹力网配件带猪皮扣
P-015	LACE网发块弹力网	LH-1024
P-016	MONO网发块胶纸网	LH-1032(有客来样）
P-017	MONO发块	LH-1015
P-018	大花胶纸帽	普通菊花网胶纸网
P-019	8*6LACE网发块	10cm调节带，两边有丝带;MONO发块改
P-020	8*6LACE网头套	25cm调节带
P-021	MONO头套两耳硅胶	MS-25
P-022	全手织头套(腾扩）	腾扩制作
P-023	中间分界0.10网（7.5*4.5")猫眼网	
P-024	中间分界0.10网弹力网	
P-025	侧分雪花网L码（0.12网）	
P-025A	侧分雪花网L码(0.10网WB色）	
P-026	小MONO，有尾	邹婷
P-027	MONO	P-003改前网不带4点硅胶
P-028	T型网两侧弹力网，尾加2¼"*1"高梅花网	
P-029	4.25*5"MONO发块	
P-030	4.5*5" MONO网	
P-031	7.25*5.25"侧分网0.10网	
P-032	顶心+前额开口网帽	
P-033	前额0.10网	
P-034	中分网0.10网	
P-035	顶心椭圆MONO网	
P-036	13*15CM MONO发块	
P-037	4.5*5" MONO 全手织前额0.10网	
P-038	4.5*5"MONO网;前额4cm LACE网	
P-039	全手织弹力网	
P-040	刘海LACE发块	4.75"*2.25"
P-041	13*6拱形弹力网，	前网防滑丝带，两耳加电话线
P-042	小面积（lace网）	
P-043	P-019改MONO网前额0.10网）按P-017帽网结构发块	
P-044	前网P-003MONO（去掉钻石网和4点）加手织网加全手织	
P-044A	前网P-003MONO（去掉钻石网和4点）加手织网加全手织	
P-045	P-003前网（4.625*5.5")改成0.10网+后网胶纸网	
P-046	全手织 前额0.10网	MS-1113
P-047	前额0.10网，后网胶纸网	MS-1114
P-048	全手织前网0.10网，后网LACE网	MS-1115
P-049	前网(4.5*5.25")MONO网加0.10网,后网胶纸网	MS-1116
P-050	前网(4.75*5.25")MONO网加0.10网,后网胶纸网	MS-1118
P-051	全机制网	MS-1119
P-052	前网(4.125*5.125")MONO网,后网胶纸网	MS-1121
P-053	全手织前网(4.625*5.5")MONO+0.10网,后网LACE网	MS-1122
P-054	前网0.10网后网中间LACE网两侧弹力网	
P-055	XM专用13*6（魔术贴）	MS-1064
P-056	13*4拱形网帽，中间弹力网，两侧渔网	￥8.70
P-057	13*6胶纸网	MS-1130.31.32
P-058	前网MONO网+3.5cm 0.10网（14.5*12cm,后网弹力网加LACE网	MS-1129
P-059	前网MONO网+加绢纱（14*11cm）后网胶纸网9mm弹力松紧	MS-1128
P-060	前网P-044网底+胶纸网	
P-061	前网P-045网底(0.10网）后网弹力机制网	
P-062	前网P-062网底（010网） 后网弹力机制网	
P-062	前网P-062网底（010网） 后网弹力机制网	
P-063	MONO 小分缝2CM*9CM	
P-064	冰丝带网帽	
P-065	发块	
P-066	中分LACE网加梅花网，后网弹力网	`

async function 导入制帽() {
  await Global.init()
  console.log("开始导入制帽数据...")

  // 解析制帽数据
  const lines = txt.split("\n").filter(line => line.trim())
  const caps = lines
    .map(line => line.split("\t"))
    .filter(cap => cap.length > 0)
    .map(cap => ({
      _id: cap[0],
      名称: cap[1] || "",
      帽网款式: cap[1] || "", // 帽网款式和名称写一样
      备注: cap[2] || "", // 最后一个是备注
      帽围: 1, // 写死1
      帽深: 1, // 写死1
      前后: 1, // 写死1
    })) as Db制帽[]

  console.log(`解析到 ${caps.length} 条制帽数据`)

  // 插入新数据
  if (caps.length > 0) {
    await Global.getCollection("制帽").deleteMany({})
    const result = await Global.getCollection("制帽").insertMany(caps)
    console.log(`成功导入 ${result.insertedCount} 条制帽数据`)
  }

  console.log("导入完成！")
}

导入制帽().catch(console.error)
