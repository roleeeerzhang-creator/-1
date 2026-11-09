/* ============================================================
   黑貂 SABLE · 2027 营销日历
   - 农历转换（1900-2100）
   - 电商大促 / 品牌营销 / 小红书内容 / 节日节点
   - 任务编辑 + localStorage 持久化
   ============================================================ */

/* ---------- 1. 农历算法 ---------- */
const lunarInfo = [
0x04bd8,0x04ae0,0x0a570,0x054d5,0x0d260,0x0d950,0x16554,0x056a0,0x09ad0,0x055d2,
0x04ae0,0x0a5b6,0x0a4d0,0x0d250,0x1d255,0x0b540,0x0d6a0,0x0ada2,0x095b0,0x14977,
0x04970,0x0a4b0,0x0b4b5,0x06a50,0x06d40,0x1ab54,0x02b60,0x09570,0x052f2,0x04970,
0x06566,0x0d4a0,0x0ea50,0x06e95,0x05ad0,0x02b60,0x186e3,0x092e0,0x1c8d7,0x0c950,
0x0d4a0,0x1d8a6,0x0b550,0x056a0,0x1a5b4,0x025d0,0x092d0,0x0d2b2,0x0a950,0x0b557,
0x06ca0,0x0b550,0x15355,0x04da0,0x0a5b0,0x14573,0x052b0,0x0a9a8,0x0e950,0x06aa0,
0x0aea6,0x0ab50,0x04b60,0x0aae4,0x0a570,0x05260,0x0f263,0x0d950,0x05b57,0x056a0,
0x096d0,0x04dd5,0x04ad0,0x0a4d0,0x0d4d4,0x0d250,0x0d558,0x0b540,0x0b6a0,0x195a6,
0x095b0,0x049b0,0x0a974,0x0a4b0,0x0b27a,0x06a50,0x06d40,0x0af46,0x0ab60,0x09570,
0x04af5,0x04970,0x064b0,0x074a3,0x0ea50,0x06b58,0x055c0,0x0ab60,0x096d5,0x092e0,
0x0c960,0x0d954,0x0d4a0,0x0da50,0x07552,0x056a0,0x0abb7,0x025d0,0x092d0,0x0cab5,
0x0a950,0x0b4a0,0x0baa4,0x0ad50,0x055d9,0x04ba0,0x0a5b0,0x15176,0x052b0,0x0a930,
0x07954,0x06aa0,0x0ad50,0x05b52,0x04b60,0x0a6e6,0x0a4e0,0x0d260,0x0ea65,0x0d530,
0x05aa0,0x076a3,0x096d0,0x04afb,0x04ad0,0x0a4d0,0x1d0b6,0x0d250,0x0d520,0x0dd45,
0x0b5a0,0x056d0,0x055b2,0x049b0,0x0a577,0x0a4b0,0x0aa50,0x1b255,0x06d20,0x0ada0,
0x14b63,0x09370,0x049f8,0x04970,0x064b0,0x168a6,0x0ea50,0x06b20,0x1a6c4,0x0aae0,
0x0a2e0,0x0d2e3,0x0c960,0x0d557,0x0d4a0,0x0da50,0x05d55,0x056a0,0x0a6d0,0x055d4,
0x052d0,0x0a9b8,0x0a950,0x0b4a0,0x0b6a6,0x0ad50,0x055a0,0x0aba4,0x0a5b0,0x052b0,
0x0b273,0x06930,0x07337,0x06aa0,0x0ad50,0x14b55,0x04b60,0x0a570,0x054e4,0x0d160,
0x0e968,0x0d520,0x0daa0,0x16aa6,0x056d0,0x04ae0,0x0a9d4,0x0a2d0,0x0d150,0x0f252,
0x0d520];

function lYearDays(y){let s=348;for(let i=0x8000;i>0x8;i>>=1)s+=(lunarInfo[y-1900]&i)?1:0;return s+leapDays(y);}
function leapMonth(y){return lunarInfo[y-1900]&0xf;}
function leapDays(y){if(leapMonth(y))return(lunarInfo[y-1900]&0x10000)?30:29;return 0;}
function monthDays(y,m){return(lunarInfo[y-1900]&(0x10000>>m))?30:29;}

const lunarMonths=['正','二','三','四','五','六','七','八','九','十','冬','腊'];
const lunarDays=['初一','初二','初三','初四','初五','初六','初七','初八','初九','初十','十一','十二','十三','十四','十五','十六','十七','十八','十九','二十','廿一','廿二','廿三','廿四','廿五','廿六','廿七','廿八','廿九','三十'];
const tianGan=['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'];
const diZhi=['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];
const zodiac=['鼠','牛','虎','兔','龙','蛇','马','羊','猴','鸡','狗','猪'];

function getGanZhi(y){return tianGan[((y-4)%10+10)%10]+diZhi[((y-4)%12+12)%12];}
function getZodiac(y){return zodiac[((y-4)%12+12)%12];}

function solar2lunar(y,m,d){
  const base=new Date(1900,0,31);
  const obj=new Date(y,m-1,d);
  let offset=Math.floor((obj-base)/86400000);
  let i,temp=0,year;
  for(i=1900;i<2101&&offset>0;i++){temp=lYearDays(i);offset-=temp;}
  if(offset<0){offset+=temp;i--;}
  year=i;
  const leap=leapMonth(year);
  let isLeap=false,month;
  for(i=1;i<13&&offset>0;i++){
    if(leap>0&&i===leap+1&&!isLeap){--i;isLeap=true;temp=leapDays(year);}
    else{temp=monthDays(year,i);}
    if(isLeap&&i===leap+1)isLeap=false;
    offset-=temp;
  }
  if(offset===0&&leap>0&&i===leap+1){if(isLeap)isLeap=false;else{isLeap=true;--i;}}
  if(offset<0){offset+=temp;--i;}
  month=i;
  return{year,month,day:offset+1,isLeap};
}

function lunarStr(l){
  const m=(l.isLeap?'闰':'')+lunarMonths[l.month-1]+'月';
  return m+lunarDays[l.day-1];
}

/* ---------- 2. 节日 ---------- */
const solarFestivals={
  '1-1':'元旦','2-14':'情人节','3-8':'妇女节','3-12':'植树节','4-1':'愚人节',
  '5-1':'劳动节','5-4':'青年节','6-1':'儿童节','7-1':'建党节','8-1':'建军节',
  '9-10':'教师节','10-1':'国庆节','11-11':'单身节','12-24':'平安夜','12-25':'圣诞节'
};
const lunarFestivals={
  '1-1':'春节','1-15':'元宵节','2-2':'龙抬头','5-5':'端午节','7-7':'七夕',
  '7-15':'中元节','8-15':'中秋节','9-9':'重阳节','12-8':'腊八节','12-23':'小年'
};

// 2027 年法定节假日放假日期（国务院办公厅 2026-11-05 公布）
const LEGAL_HOLIDAYS_2027=new Set([
  '2027-01-01','2027-01-02','2027-01-03',          // 元旦 3天
  '2027-02-05','2027-02-06','2027-02-07','2027-02-08','2027-02-09',
  '2027-02-10','2027-02-11','2027-02-12','2027-02-13', // 春节 9天
  '2027-04-03','2027-04-04','2027-04-05',           // 清明 3天
  '2027-05-01','2027-05-02','2027-05-03','2027-05-04','2027-05-05', // 劳动节 5天
  '2027-06-09',                                    // 端午 1天
  '2027-09-15',                                    // 中秋 1天
  '2027-10-01','2027-10-02','2027-10-03','2027-10-04',
  '2027-10-05','2027-10-06','2027-10-07'            // 国庆 7天
]);
// 调休上班日（周末但需上班）
const ADJUSTED_WORKDAYS_2027=new Set([
  '2027-01-31','2027-02-14',  // 春节调休
  '2027-05-08',               // 劳动节调休
  '2027-09-26','2027-10-09'   // 国庆调休
]);

// 动态节日：第 n 个周几
function nthWeekday(y,m,weekday,n){
  // weekday: 0=Sun
  const first=new Date(y,m,1).getDay();
  let day=1+((weekday-first+7)%7)+(n-1)*7;
  return new Date(y,m,day);
}
function dynamicFestivals(y){
  const f={};
  const mom=nthWeekday(y,4,0,2);f[mom.getTime()]='母亲节';// 5月第2个周日
  const dad=nthWeekday(y,5,0,3);f[dad.getTime()]='父亲节';// 6月第3个周日
  const thanks=nthWeekday(y,10,4,4);f[thanks.getTime()]='感恩节';// 11月第4个周四
  return f;
}

function getFestival(y,m,d){
  const l=solar2lunar(y,m,d);
  const sf=solarFestivals[`${m}-${d}`];
  const lf=lunarFestivals[`${l.month}-${l.day}`];
  // 除夕：腊月最后一天
  let cx=false;
  const nextDay=new Date(y,m-1,d+1);
  const nl=solar2lunar(nextDay.getFullYear(),nextDay.getMonth()+1,nextDay.getDate());
  if(nl.month===1&&nl.day===1)cx=true;
  const dyn=dynamicFestivals(y);
  const df=dyn[new Date(y,m-1,d).getTime()];
  return{solar:sf,lunar:lunarFestivals[`${l.month}-${l.day}`],chuxi:cx,dynamic:df,lunarInfo:l};
}

/* ---------- 3. 2027 营销节点数据 ---------- */
// type: ecommerce | marketing | content | festival
const MARKETING_EVENTS=[
  // ===== 1月 年货节 =====
  {date:'2027-01-10',type:'ecommerce',title:'年货节·蓄水启动',
   note:'年货节预售开启，天猫/京东/抖音全域蓄水。'},
  {date:'2027-01-15',type:'content',title:'小红书「年味」内容铺量',
   note:'年味穿搭、年货清单、送礼指南笔记集中投放，启动年货话题。'},
  {date:'2027-01-20',type:'marketing',title:'黑貂「新年限定」发布',
   note:'品牌新年限定系列官宣，配合达人种草+信息流。'},
  {date:'2027-01-25',type:'ecommerce',title:'年货节·爆发期',
   note:'天猫年货节正式开卖，全渠道促销上线。'},

  // ===== 2月 春节 =====
  {date:'2027-02-05',type:'festival',title:'除夕',note:'阖家团圆，品牌春节祝福内容上线。'},
  {date:'2027-02-06',type:'festival',title:'春节',note:'春节假期，品牌拜年海报/视频。'},
  {date:'2027-02-14',type:'marketing',title:'情人节营销',
   note:'黑貂情侣款/礼物向内容投放，电商情人节专题。'},
  {date:'2027-02-20',type:'festival',title:'元宵节',note:'节后复工，春节营销收官。'},

  // ===== 3月 38女王节 =====
  {date:'2027-03-01',type:'ecommerce',title:'38女王节·预售',
   note:'天猫38节预售开启，女性向品类大促。'},
  {date:'2027-03-05',type:'content',title:'小红书「她力量」内容',
   note:'女性成长、独立穿搭、悦己消费主题笔记集中发布。'},
  {date:'2027-03-08',type:'ecommerce',title:'38女王节·爆发',
   note:'妇女节当天爆发，直播间+限时优惠。'},
  {date:'2027-03-09',type:'marketing',title:'龙抬头品牌内容',
   note:'传统节日借势，国潮/新中式主题内容。'},

  // ===== 4月 春游/踏青 =====
  {date:'2027-04-05',type:'festival',title:'清明节',note:'春游踏青内容，春季新品。'},
  {date:'2027-04-10',type:'content',title:'小红书「春日穿搭」专题',
   note:'春季新品穿搭、OOTD、旅行穿搭笔记铺量。'},
  {date:'2027-04-20',type:'marketing',title:'黑貂春夏新品发布',
   note:'春夏系列官宣，KOL+素人种草矩阵。'},

  // ===== 5月 520 + 618预热 =====
  {date:'2027-05-09',type:'marketing',title:'母亲节营销',
   note:'感恩母爱主题，礼物清单+亲情内容。'},
  {date:'2027-05-15',type:'ecommerce',title:'520大促·预热',
   note:'520促销预售，情侣/礼物向品类主推。'},
  {date:'2027-05-20',type:'ecommerce',title:'520·爆发日',
   note:'520当天全渠道爆发，直播+限时秒杀。'},
  {date:'2027-05-24',type:'content',title:'618种草内容启动',
   note:'618好物清单、测评、攻略类笔记集中上线蓄水。'},
  {date:'2027-05-26',type:'ecommerce',title:'618·预售开启',
   note:'天猫618预售付定，跨店满减上线。'},
  {date:'2027-05-31',type:'ecommerce',title:'618·现货开卖',
   note:'618现货第一波，开门红爆发。'},

  // ===== 6月 618 + 66周年庆 =====
  {date:'2027-06-01',type:'content',title:'小红书「66周年庆」内容爆发',
   note:'小红书平台66周年庆（5.22-6.18），品牌专属会场+内容种草。'},
  {date:'2027-06-06',type:'ecommerce',title:'小红书66周年庆·Big Day',
   note:'小红书66周年庆核心爆发日，平台级流量扶持。'},
  {date:'2027-06-18',type:'ecommerce',title:'618·终极爆发',
   note:'618当天全平台爆发，直播间+尾款支付高峰。'},
  {date:'2027-06-09',type:'festival',title:'端午节',note:'端午安康内容，节后返场促销。'},
  {date:'2027-06-20',type:'marketing',title:'父亲节营销',note:'男性向品类/亲情内容。'},
  {date:'2027-06-21',type:'ecommerce',title:'618·返场收官',note:'618返场，清库存+复盘。'},

  // ===== 7月 狂暑季预热 =====
  {date:'2027-07-01',type:'content',title:'小红书「夏日清凉」内容',
   note:'夏日穿搭、清凉好物、出游攻略笔记。'},
  {date:'2027-07-07',type:'festival',title:'小暑',note:'节气内容，夏季场景营销。'},
  {date:'2027-07-15',type:'ecommerce',title:'狂暑季·启动',
   note:'天猫狂暑季开启，夏季品类大促。'},
  {date:'2027-07-23',type:'festival',title:'大暑',note:'最热时节，清凉/防晒内容。'},

  // ===== 8月 狂暑季 + 七夕 + 秋上新 =====
  {date:'2027-08-01',type:'ecommerce',title:'狂暑季·爆发期',
   note:'夏季清仓+秋款预热，跨店满减。'},
  {date:'2027-08-05',type:'content',title:'小红书「七夕」内容铺量',
   note:'七夕礼物、约会穿搭、情侣好物笔记集中投放。'},
  {date:'2027-08-08',type:'festival',title:'七夕节',note:'七夕当天，情人节级别的内容+电商爆发。'},
  {date:'2027-08-18',type:'marketing',title:'黑貂「秋冬预告」发布',
   note:'秋冬系列预告，小红书秋上新话题参与。'},
  {date:'2027-08-23',type:'festival',title:'处暑',note:'夏末秋初，换季内容。'},

  // ===== 9月 99大促 + 中秋 =====
  {date:'2027-09-01',type:'content',title:'小红书「秋上新」内容爆发',
   note:'秋季穿搭、换季好物、开学季笔记铺量。'},
  {date:'2027-09-09',type:'ecommerce',title:'99大促',
   note:'聚划算99大促，秋季新品促销。'},
  {date:'2027-09-10',type:'festival',title:'教师节',note:'教师礼/感恩内容。'},
  {date:'2027-09-13',type:'marketing',title:'中秋营销启动',
   note:'中秋礼盒、团圆主题内容预热。'},
  {date:'2027-09-15',type:'festival',title:'中秋节',note:'中秋当天，团圆/送礼内容爆发。'},

  // ===== 10月 国庆 + 双11预热 =====
  {date:'2027-10-01',type:'ecommerce',title:'国庆黄金周',
   note:'国庆假期全渠道促销，出游/穿搭内容。'},
  {date:'2027-10-08',type:'content',title:'小红书「双11种草」启动',
   note:'双11好物清单、囤货攻略笔记集中上线蓄水。'},
  {date:'2027-10-15',type:'marketing',title:'黑貂「双11」品牌预告',
   note:'双11品牌战略官宣，明星/达人合作官宣。'},
  {date:'2027-10-08',type:'festival',title:'重阳节',note:'敬老/亲情内容。'},
  {date:'2027-10-24',type:'ecommerce',title:'双11·预售开启',
   note:'天猫双11预售付定，跨店满减300-50。'},
  {date:'2027-10-31',type:'ecommerce',title:'双11·第一波现货',
   note:'双11现货开卖，第一波爆发。'},

  // ===== 11月 双11 =====
  {date:'2027-11-01',type:'content',title:'小红书「双11必买」内容爆发',
   note:'双11必买清单、限时优惠攻略笔记。'},
  {date:'2027-11-11',type:'ecommerce',title:'双11·终极爆发',
   note:'双11当天全球狂欢，24小时不间断直播+秒杀。'},
  {date:'2027-11-12',type:'ecommerce',title:'双11·返场',
   note:'双11返场，清库存+晒单内容。'},
  {date:'2027-11-25',type:'marketing',title:'感恩节营销',note:'感恩回馈内容+老客维护。'},

  // ===== 12月 双12 + 跨年 =====
  {date:'2027-12-05',type:'content',title:'小红书「双12/年终」内容',
   note:'年终好物、圣诞礼物、跨年穿搭笔记。'},
  {date:'2027-12-12',type:'ecommerce',title:'双12·年终大促',
   note:'双12年终大促，全品类促销。'},
  {date:'2027-12-22',type:'festival',title:'冬至',note:'冬至团圆内容，冬季保暖场景。'},
  {date:'2027-12-24',type:'festival',title:'平安夜',note:'圣诞营销爆发前夜。'},
  {date:'2027-12-25',type:'marketing',title:'圣诞节营销',
   note:'圣诞主题内容+礼盒促销。'},
  {date:'2027-12-28',type:'content',title:'小红书「跨年」内容铺量',
   note:'年终总结、新年战袍、跨年攻略笔记。'},
  {date:'2027-12-31',type:'marketing',title:'跨年营销',
   note:'跨年倒计时内容，新年营销预热。'}
];

/* ---------- 4. 黑貂内容投放策略模板 ---------- */
// 按关键节点提供内容铺设建议
const CONTENT_PLANS={
  '年货节':{
    tag:'ecommerce',
    phases:[
      {phase:'蓄水期 (1月上)',theme:'年货+新春运动内容',items:[
        '「新年FLAG·学游泳/坚持游泳」主题笔记，达人+素人矩阵',
        '泳镜年货清单、运动送礼指南合集（送长辈/孩子/伴侣）',
        '小红书「新年好礼」「运动年货」话题参与',
        '黑貂新年限定款泳镜/泳帽悬念预热']},
      {phase:'爆发期 (1月中下)',theme:'年货节转化',items:[
        '直播间年货专场：亲子套装/情侣款限时优惠',
        '达人测评+开箱内容二次分发',
        '信息流投放锁定健身/亲子/游泳兴趣人群',
        '私域社群年货券+老客复购券推送']}
    ]
  },
  '38女王节':{
    tag:'ecommerce',
    phases:[
      {phase:'预热期 (3月初)',theme:'她力量·女性游泳内容',items:[
        '女性游泳健身、产后恢复游泳、悦己运动主题笔记',
        'KOL「女生游泳入门」「泳镜不勒眼」干货短视频',
        '黑貂女性款/大框舒适泳镜内容上线']},
      {phase:'爆发期 (3.8)',theme:'女王节转化',items:[
        '女性向品类专属优惠（大框泳镜、颜值款泳镜）',
        '直播间女王专场',
        '小红书「女生节」「她力量」话题营销']}
    ]
  },
  '520':{
    tag:'ecommerce',
    phases:[
      {phase:'预热期 (5月中)',theme:'情侣运动内容',items:[
        '情侣泳镜、亲子戏水、海边度假好物笔记',
        '520运动礼物清单合集（情侣款泳镜/泳帽）',
        '达人CP「一起游泳」合作内容']},
      {phase:'爆发期 (5.20)',theme:'520转化',items:[
        '限时秒杀+情侣款组合装',
        '直播间520专场',
        '告白/情侣游泳UGC话题活动']}
    ]
  },
  '618':{
    tag:'ecommerce',
    phases:[
      {phase:'蓄水期 (5月中下)',theme:'夏季游泳种草铺量',items:[
        '泳镜选购指南、防雾镀膜测评、竞速vs休闲对比笔记集中发布',
        '小红书「66周年庆」内容同步，泳镜品类会场种草',
        '达人种草矩阵全覆盖（游泳博主+健身博主+亲子博主）',
        '黑貂618主推款悬念预告']},
      {phase:'预售期 (5.26-5.31)',theme:'预售转化',items:[
        '预售攻略笔记+尾款提醒内容',
        '直播间预售专场，主推爆款泳镜',
        '信息流投放收割夏季游泳意向人群']},
      {phase:'爆发期 (6.1-6.18)',theme:'618全域爆发',items:[
        '6.1开门红+6.18终极爆发两波冲刺',
        '直播间连播，主推泳镜+泳帽+泳包套装',
        '限时秒杀+跨店满减',
        '实时战报内容二次传播']},
      {phase:'返场期 (6.19-6.21)',theme:'返场清库存',items:[
        '返场促销+晒单UGC',
        '618战报发布',
        '复盘与内容资产沉淀']}
    ]
  },
  '狂暑季':{
    tag:'ecommerce',
    phases:[
      {phase:'启动期 (7月中)',theme:'夏日游泳内容',items:[
        '夏日泳池OOTD、海边度假装备、亲子戏水笔记',
        '防雾泳镜/镀膜泳镜测评，「泳镜不起雾」干货',
        '小红书「夏日穿搭」「海边度假」话题营销']},
      {phase:'爆发期 (8月)',theme:'狂暑季转化',items:[
        '夏季爆款泳镜清仓+秋冬训练款预热',
        '跨店满减+直播间专场',
        '儿童泳镜/学游泳装备暑期主推']}
    ]
  },
  '七夕':{
    tag:'festival',
    phases:[
      {phase:'预热期 (8月初)',theme:'浪漫运动内容',items:[
        '七夕运动礼物、情侣泳镜、海边约会笔记集中投放',
        '情侣游泳/双人潜水好物合集',
        '达人CP合作内容']},
      {phase:'爆发期 (8.8)',theme:'七夕转化',items:[
        '七夕限定情侣款泳镜上线',
        '直播间七夕专场',
        '告白/情侣游泳UGC话题活动']}
    ]
  },
  '中秋':{
    tag:'festival',
    phases:[
      {phase:'预热期 (9月初)',theme:'秋日游泳内容',items:[
        '恒温泳池训练、秋日游泳装备笔记',
        '中秋亲子游泳、家庭运动主题内容',
        '黑貂秋冬训练款泳镜上新内容']},
      {phase:'爆发期 (9.15)',theme:'中秋营销',items:[
        '团圆主题内容爆发，亲子游泳套装促销',
        '礼盒促销+直播间专场']}
    ]
  },
  '国庆':{
    tag:'ecommerce',
    phases:[
      {phase:'预热期 (9月底)',theme:'出游游泳内容',items:[
        '国庆海边度假、亲子戏水、恒温泳池攻略笔记',
        '假期游泳装备清单（泳镜/泳帽/耳塞/鼻夹）']},
      {phase:'爆发期 (10.1-10.7)',theme:'黄金周转化',items:[
        '全渠道国庆促销，主推度假/亲子款',
        '直播间假期专场',
        '出游UGC话题活动']}
    ]
  },
  '双11':{
    tag:'ecommerce',
    phases:[
      {phase:'蓄水期 (10月上中)',theme:'冬季游泳种草铺量',items:[
        '泳镜囤货攻略、年度爆款盘点、专业训练装备笔记集中上线',
        '达人种草矩阵全覆盖（游泳/铁三/健身/亲子）',
        '黑貂双11品牌战略官宣',
        '年度重磅新品（如智能泳镜/竞速款）官宣']},
      {phase:'预售期 (10.24-10.31)',theme:'预售转化',items:[
        '预售攻略+尾款提醒内容',
        '直播间预售专场',
        '信息流收割运动装备意向人群']},
      {phase:'爆发期 (11.1-11.11)',theme:'双11全域爆发',items:[
        '11.1第一波+11.11终极爆发',
        '24小时不间断直播，主推泳镜+泳帽+泳包囤货套装',
        '限时秒杀+跨店满减300-50',
        '实时战报二次传播']},
      {phase:'返场期 (11.12-11.15)',theme:'返场清库存',items:[
        '返场促销+晒单UGC',
        '双11战报发布',
        '复盘与内容资产沉淀']}
    ]
  },
  '双12':{
    tag:'ecommerce',
    phases:[
      {phase:'预热期 (12月中)',theme:'年终+寒假内容',items:[
        '年终游泳装备盘点、寒假学游泳装备笔记',
        '儿童泳镜/学游泳套装主推',
        '年终总结/品牌年度内容']},
      {phase:'爆发期 (12.12)',theme:'双12转化',items:[
        '年终大促全品类促销',
        '直播间年终专场',
        '寒假学游泳装备专题']}
    ]
  }
};

// 节点名称关键词匹配到内容计划
function matchPlan(eventTitle){
  for(const key in CONTENT_PLANS){
    if(eventTitle.includes(key))return{key,...CONTENT_PLANS[key]};
  }
  return null;
}

/* ---------- 5. 状态管理 ---------- */
let currentYear=2027;
let currentMonth=0; // 0-indexed
let selectedDate=null;
let currentView='month';
let editingTaskId=null;

const STORAGE_KEY='sable_2027_events';
const CLOUD_KEY='sable_cloud_config';
const USER_KEY='sable_user_name';
const NOTIFY_KEY='sable_notified';

function loadEvents(){
  try{return JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}');}catch(e){return{};}
}
function saveEvents(events){localStorage.setItem(STORAGE_KEY,JSON.stringify(events));}
let userEvents=loadEvents();

// 操作人名称（首次使用时设置）
let currentUser=localStorage.getItem(USER_KEY)||'';

// 已发送验收提醒的节点 id 集合（避免重复提醒）
let notifiedAcceptance=new Set(JSON.parse(localStorage.getItem(NOTIFY_KEY)||'[]'));
function saveNotified(){localStorage.setItem(NOTIFY_KEY,JSON.stringify([...notifiedAcceptance]));}

// 上次同步的节点指纹，用于检测远程变更
let lastSyncHash='';

/* ---------- 云同步 (Supabase) ---------- */
let cloudConfig=null;
try{cloudConfig=JSON.parse(localStorage.getItem(CLOUD_KEY)||'null');}catch(e){cloudConfig=null;}

// 钉钉配置（从 Supabase app_config 表加载，团队共享）
let dingtalkConfig={webhook:'',secret:'',atAll:false,atMobiles:''};

function isCloud(){return cloudConfig&&cloudConfig.url&&cloudConfig.key;}

async function cloudFetch(path,opts={}){
  const headers={
    'apikey':cloudConfig.key,
    'Authorization':`Bearer ${cloudConfig.key}`,
    'Content-Type':'application/json',
    'Prefer':'return=representation'
  };
  const res=await fetch(`${cloudConfig.url}/rest/v1${path}`,{...opts,headers});
  if(!res.ok){const t=await res.text();throw new Error(`HTTP ${res.status}: ${t}`);}
  return res.status===204?null:res.json();
}

// 加载团队共享配置（钉钉 webhook 等）
async function loadAppConfig(){
  if(!isCloud())return;
  try{
    const rows=await cloudFetch('/app_config?select=*');
    if(rows&&rows.length){
      const cfg=rows[0];
      dingtalkConfig={
        webhook:cfg.dingtalk_webhook||'',
        secret:cfg.dingtalk_secret||'',
        atAll:!!cfg.dingtalk_at_all,
        atMobiles:cfg.dingtalk_at_mobiles||''
      };
    }
  }catch(e){/* 配置表可能不存在，忽略 */}
}

// 保存团队共享配置到 Supabase
async function saveAppConfig(){
  if(!isCloud())return;
  const webhook=document.getElementById('dingWebhook').value.trim();
  const secret=document.getElementById('dingSecret').value.trim();
  const atMobiles=document.getElementById('dingMobiles').value.trim();
  const atAll=document.getElementById('dingAtAll').checked;
  dingtalkConfig={webhook,secret,atAll,atMobiles};
  try{
    // 先尝试查询是否已有配置
    const existing=await cloudFetch('/app_config?select=id&limit=1');
    const body={dingtalk_webhook:webhook||null,dingtalk_secret:secret||null,dingtalk_at_all:atAll,dingtalk_at_mobiles:atMobiles||null};
    if(existing&&existing.length){
      await cloudFetch(`/app_config?id=eq.${existing[0].id}`,{method:'PATCH',body:JSON.stringify(body)});
    }else{
      await cloudFetch('/app_config',{method:'POST',body:JSON.stringify(body)});
    }
  }catch(e){
    console.warn('钉钉配置保存失败（需先创建 app_config 表）:',e);
    showCloudStatus('钉钉配置保存失败：请先在 Supabase 创建 app_config 表',true);
  }
}

async function loadCloudEvents(){
  if(!isCloud())return;
  try{
    const rows=await cloudFetch('/calendar_events?select=*');
    const map={};
    rows.forEach(r=>{
      const k=r.date;
      if(!map[k])map[k]=[];
      map[k].push({
        id:r.id,date:r.date,type:r.type,title:r.title,note:r.note,
        time:r.time,remind:r.remind,done:!!r.done,
        important:!!r.important,created_by:r.created_by||''
      });
    });
    const newHash=JSON.stringify(map);
    const changed=newHash!==lastSyncHash;
    userEvents=map;
    saveEvents(map);
    lastSyncHash=newHash;
    return changed;
  }catch(e){
    console.error('云同步读取失败:',e);
    showCloudStatus('云端读取失败：'+e.message,true);
    return false;
  }
}

async function saveCloudEvent(event){
  if(!isCloud())return event.id;
  try{
    const body={
      date:event.date,type:event.type,title:event.title,note:event.note||null,
      time:event.time||null,remind:event.remind||'none',done:!!event.done,
      important:!!event.important,created_by:event.created_by||currentUser||'匿名'
    };
    if(event.id&&!String(event.id).startsWith('local_')){
      const [r]=await cloudFetch(`/calendar_events?id=eq.${event.id}`,{method:'PATCH',body:JSON.stringify(body)});
      return r.id;
    }else{
      const [r]=await cloudFetch('/calendar_events',{method:'POST',body:JSON.stringify(body)});
      return r.id;
    }
  }catch(e){
    console.error('云端保存失败:',e);
    showCloudStatus('云端保存失败：'+e.message,true);
    throw e;
  }
}

async function deleteCloudEvent(id){
  if(!isCloud()||String(id).startsWith('local_'))return;
  try{await cloudFetch(`/calendar_events?id=eq.${id}`,{method:'DELETE'});}
  catch(e){console.error('云端删除失败:',e);}
}

/* ---------- 钉钉通知 ---------- */
function dingtalkSign(secret){
  if(!secret)return '';
  const ts=Date.now();
  const stringToSign=`${ts}\n${secret}`;
  // 钉钉签名需要 HmacSHA256 + Base64 + URL encode，前端用 Web Crypto
  return new Promise(resolve=>{
    const enc=new TextEncoder().encode(stringToSign);
    const keyEnc=new TextEncoder().encode(secret);
    crypto.subtle.importKey('raw',keyEnc,{name:'HMAC',hash:'SHA-256'},false,['sign'])
      .then(key=>crypto.subtle.sign('HMAC',key,enc))
      .then(sig=>{
        const b64=btoa(String.fromCharCode(...new Uint8Array(sig)));
        resolve(`&timestamp=${ts}&sign=${encodeURIComponent(b64)}`);
      })
      .catch(()=>resolve(''));
  });
}

async function sendDingTalk(action,event){
  if(!dingtalkConfig.webhook)return;
  const typeLabel={ecommerce:'电商大促',marketing:'品牌营销',content:'小红书内容',festival:'节日节点',reminder:'任务提醒'}[event.type]||event.type;
  const actionLabel={create:'🆕 新增',update:'✏️ 修改',delete:'🗑️ 删除'}[action]||action;
  const operator=currentUser||'匿名';
  const calendarUrl='https://roleeeerzhang-creator.github.io/-1/';
  const text=`### ${actionLabel}重要节点 · ${event.title}\n\n`+
    `> **操作人**：${operator}\n`+
    `> **类型**：${typeLabel}${event.important?' · 🔴重要':''}\n`+
    `> **日期**：${event.date}${event.time?' '+event.time:''}\n`+
    `${event.remind&&event.remind!=='none'?`> **提醒**：${remindLabel(event.remind)}\n`:''}`+
    `${event.note?`\n**备注**：${event.note}\n`:''}`+
    `\n[📅 打开营销日历](${calendarUrl})`;

  const at={isAtAll:!!dingtalkConfig.atAll};
  if(dingtalkConfig.atMobiles){
    at.atMobiles=dingtalkConfig.atMobiles.split(/[,，\s]+/).filter(Boolean);
  }
  const payload={msgtype:'markdown',markdown:{title:`${actionLabel} ${event.title}`,text},at};

  try{
    const sign=dingtalkConfig.secret?await dingtalkSign(dingtalkConfig.secret):'';
    const res=await fetch(dingtalkConfig.webhook+sign,{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify(payload)
    });
    const data=await res.json();
    if(data.errcode!==0)console.warn('钉钉通知失败:',data);
  }catch(e){console.warn('钉钉通知异常:',e);}
}

// 发送验收提醒
async function sendAcceptanceReminder(event){
  if(!dingtalkConfig.webhook)return;
  if(notifiedAcceptance.has(event.id))return;
  const typeLabel={ecommerce:'电商大促',marketing:'品牌营销',content:'小红书内容',festival:'节日节点',reminder:'任务提醒'}[event.type]||event.type;
  const calendarUrl='https://roleeeerzhang-creator.github.io/-1/';
  const text=`### 📋 验收提醒 · ${event.title}\n\n`+
    `> **类型**：${typeLabel}${event.important?' · 🔴重要':''}\n`+
    `> **日期**：${event.date}${event.time?' '+event.time:''}\n`+
    `> **负责人**：${event.created_by||'未指定'}\n`+
    `${event.note?`\n**内容**：${event.note}\n`:''}`+
    `\n请相关同事点击下方链接完成验收并反馈进度 👇\n`+
    `[📅 打开营销日历](${calendarUrl})`;
  const at={isAtAll:false};
  if(dingtalkConfig.atMobiles){at.atMobiles=dingtalkConfig.atMobiles.split(/[,，\s]+/).filter(Boolean);}
  const payload={msgtype:'markdown',markdown:{title:`验收提醒：${event.title}`,text},at};
  try{
    const sign=dingtalkConfig.secret?await dingtalkSign(dingtalkConfig.secret):'';
    await fetch(dingtalkConfig.webhook+sign,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
    notifiedAcceptance.add(event.id);
    saveNotified();
  }catch(e){console.warn('验收提醒发送失败:',e);}
}

// 检查到期的验收提醒
function checkAcceptanceReminders(){
  if(!isCloud()||!dingtalkConfig.webhook)return;
  const now=new Date();
  const today=dateKey(now.getFullYear(),now.getMonth()+1,now.getDate());
  for(const k in userEvents){
    userEvents[k].forEach(ev=>{
      if(ev.done)return;
      if(!ev.remind||ev.remind==='none')return;
      // 提前1天或当天发送验收提醒
      const evDate=new Date(ev.date);
      const diffDays=Math.ceil((evDate-now)/(1000*60*60*24));
      if(diffDays<=1&&diffDays>=-7){
        sendAcceptanceReminder(ev);
      }
    });
  }
}

/* ---------- 实时同步（轮询 + Realtime） ---------- */
let pollTimer=null;
let realtimeSocket=null;

async function syncRemote(){
  if(!isCloud())return;
  const changed=await loadCloudEvents();
  updateSyncIndicator();
  if(changed){
    renderCalendar();
    if(selectedDate)renderDetail(selectedDate);
    showToast('🔄 检测到节点更新，已同步');
    checkAcceptanceReminders();
  }
}

function startSync(){
  if(!isCloud())return;
  // 轮询兜底（每 15 秒）
  if(pollTimer)clearInterval(pollTimer);
  pollTimer=setInterval(syncRemote,15000);
  // 尝试 Supabase Realtime
  try{
    const wsUrl=`${cloudConfig.url.replace('https','wss')}/realtime/v1?apikey=${cloudConfig.key}`;
    realtimeSocket=new WebSocket(wsUrl);
    realtimeSocket.onopen=()=>{
      realtimeSocket.send(JSON.stringify({
        event:'phx_join',
        topic:`realtime:public:calendar_events`,
        payload:{},
        ref:0
      }));
    };
    realtimeSocket.onmessage=(e)=>{
      try{
        const msg=JSON.parse(e.data);
        if(msg.event==='phx_reply'||msg.event==='postgres_changes'){
          syncRemote();
        }
      }catch(err){}
    };
  }catch(e){/* realtime 不可用时依赖轮询 */}
}

function updateSyncIndicator(){
  const el=document.getElementById('syncIndicator');
  if(!el)return;
  const now=new Date();
  const t=`${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}:${String(now.getSeconds()).padStart(2,'0')}`;
  el.innerHTML=isCloud()?`<span class="sync-dot"></span>已同步 ${t}`:`<span class="sync-dot offline"></span>本地模式`;
}

function showToast(msg){
  let t=document.getElementById('toast');
  if(!t){
    t=document.createElement('div');
    t.id='toast';
    document.body.appendChild(t);
  }
  t.textContent=msg;
  t.className='toast show';
  clearTimeout(t._timer);
  t._timer=setTimeout(()=>t.classList.remove('show'),2500);
}

function showCloudStatus(msg,isErr){
  const el=document.getElementById('cloudStatus');
  if(!el)return;
  el.textContent=msg;
  el.className='cloud-status '+(isErr?'err':'ok');
}

function dateKey(y,m,d){return`${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`;}

/* ---------- 6. 渲染日历 ---------- */
const daysGrid=document.getElementById('daysGrid');

function renderCalendar(){
  daysGrid.innerHTML='';
  const firstDay=new Date(currentYear,currentMonth,1);
  const startWeekday=firstDay.getDay();
  const daysInMonth=new Date(currentYear,currentMonth+1,0).getDate();
  const prevDays=new Date(currentYear,currentMonth,0).getDate();

  // header
  document.getElementById('navYear').textContent=currentYear;
  document.getElementById('navMonth').textContent=['一月','二月','三月','四月','五月','六月','七月','八月','九月','十月','十一月','十二月'][currentMonth];
  document.getElementById('navLunarYear').textContent=`${getGanZhi(currentYear)}年 · ${getZodiac(currentYear)}`;

  const today=new Date();
  const todayKey=dateKey(today.getFullYear(),today.getMonth()+1,today.getDate());

  // prev month cells
  for(let i=startWeekday-1;i>=0;i--){
    const d=prevDays-i;
    daysGrid.appendChild(createDayCell(currentYear,currentMonth-1,d,true,todayKey));
  }
  // current month
  for(let d=1;d<=daysInMonth;d++){
    daysGrid.appendChild(createDayCell(currentYear,currentMonth,d,false,todayKey));
  }
  // next month fill to 42 cells
  const total=startWeekday+daysInMonth;
  const remain=(total%7===0?0:7-total%7);
  for(let d=1;d<=remain;d++){
    daysGrid.appendChild(createDayCell(currentYear,currentMonth+1,d,true,todayKey));
  }
}

function createDayCell(y,m,d,otherMonth,todayKey){
  // normalize month/year
  const date=new Date(y,m,d);
  const cy=date.getFullYear(),cm=date.getMonth()+1,cd=date.getDate();
  const key=dateKey(cy,cm,cd);

  const cell=document.createElement('div');
  cell.className='day-cell';
  if(otherMonth)cell.classList.add('other-month');
  if(key===todayKey)cell.classList.add('today');
  if(selectedDate===key)cell.classList.add('selected');

  const fest=getFestival(cy,cm,cd);
  const lunar=fest.lunarInfo;

  // events for this date
  const events=MARKETING_EVENTS.filter(e=>e.date===key);
  const tasks=(userEvents[key]||[]);
  const allItems=[...events.map(e=>({...e,source:'event'})),...tasks.map(t=>({...t,source:'task',type:t.type}))];

  let lunarLabel='';
  if(lunar.day===1)lunarLabel=(lunar.isLeap?'闰':'')+lunarMonths[lunar.month-1]+'月';
  else lunarLabel=lunarDays[lunar.day-1];
  if(fest.solar)lunarLabel=fest.solar;
  else if(fest.lunar)lunarLabel=fest.lunar;
  else if(fest.chuxi)lunarLabel='除夕';
  else if(fest.dynamic)lunarLabel=fest.dynamic;

  const hasFestival=fest.solar||fest.lunar||fest.chuxi||fest.dynamic;
  if(hasFestival)cell.classList.add('has-festival');

  const isHoliday=LEGAL_HOLIDAYS_2027.has(key);
  const isWorkday=ADJUSTED_WORKDAYS_2027.has(key);
  if(isHoliday)cell.classList.add('is-holiday');

  cell.innerHTML=`
    <div class="day-header">
      <span class="day-num">${cd}</span>
      <span class="day-lunar">${lunarLabel}</span>
    </div>
    <div class="day-chips">
      ${allItems.slice(0,3).map(it=>`<span class="chip chip-${it.type}">${it.important?'<i class="imp-dot"></i>':''}${it.title}</span>`).join('')}
      ${allItems.length>3?`<span class="day-more">+${allItems.length-3} 更多</span>`:''}
    </div>
    <div class="day-badges">
      ${isHoliday?'<span class="holiday-dot" title="法定节假日"></span>':''}
      ${isWorkday?'<span class="workday-tag" title="调休上班">班</span>':''}
    </div>
  `;

  cell.addEventListener('click',()=>selectDate(key));
  return cell;
}

/* ---------- 7. 详情面板 ---------- */
function selectDate(key){
  selectedDate=key;
  renderCalendar();
  renderDetail(key);
}

function renderDetail(key){
  const empty=document.getElementById('detailEmpty');
  const content=document.getElementById('detailContent');
  empty.style.display='none';
  content.style.display='block';

  const [y,m,d]=key.split('-').map(Number);
  const fest=getFestival(y,m,d);
  const lunar=fest.lunarInfo;
  const weekNames=['星期日','星期一','星期二','星期三','星期四','星期五','星期六'];

  const events=MARKETING_EVENTS.filter(e=>e.date===key);
  const tasks=userEvents[key]||[];

  let html=`
    <div class="detail-date">
      <div class="d-solar">${y}年${m}月${d}日</div>
      <div class="d-lunar">农历 ${(lunar.isLeap?'闰':'')+lunarMonths[lunar.month-1]}月${lunarDays[lunar.day-1]} · ${getGanZhi(lunar.year)}年</div>
      <div class="d-week">${weekNames[new Date(y,m-1,d).getDay()]}</div>
    </div>
  `;

  // 营销节点
  if(events.length){
    html+='<div class="section-title"><h4>📌 营销节点</h4></div>';
    events.forEach(ev=>{
      html+=`<div class="event-item" style="border-left-color:var(--${ev.type})">
        <div class="ev-title">${ev.title}</div>
        <div class="ev-meta">${typeLabel(ev.type)}${ev.note?' · '+shorten(ev.note,40):''}</div>
      </div>`;
      const plan=matchPlan(ev.title);
      if(plan){
        html+=`<div class="plan-block">
          <div class="plan-phase">📋 黑貂内容投放策略 · ${plan.key}</div>
          ${plan.phases.map(p=>`
            <div style="margin-top:8px">
              <div class="plan-theme">${p.phase} — ${p.theme}</div>
              <ul>${p.items.map(i=>`<li>${i}</li>`).join('')}</ul>
            </div>
          `).join('')}
        </div>`;
      }
    });
  }

  // 任务
  html+=`<div class="section-title"><h4>📌 手动节点 & 任务</h4>
    <button class="add-btn" id="addTaskBtn" title="添加节点">+</button></div>`;
  if(tasks.length===0){
    html+='<div style="color:var(--text-mute);font-size:12px;padding:8px 0">暂无任务，点击 + 添加</div>';
  }else{
    tasks.forEach(t=>{
      html+=`<div class="task-item ${t.done?'done':''}" data-id="${t.id}">
        <div class="task-check" data-id="${t.id}"></div>
        <div class="task-body">
          <div class="task-title">${t.title}${t.important?'<span class="important-badge">🔴重要</span>':''}</div>
          <div class="task-meta">
            ${t.time?`<span>🕐 ${t.time}</span>`:''}
            <span><i class="dot dot-${t.type}" style="width:7px;height:7px"></i> ${typeLabel(t.type)}</span>
            ${t.remind&&t.remind!=='none'?`<span>🔔 ${remindLabel(t.remind)}</span>`:''}
            ${t.created_by?`<span class="task-by">👤 ${t.created_by}</span>`:''}
          </div>
          ${t.note?`<div class="task-note">${t.note}</div>`:''}
        </div>
        <button class="task-del" data-id="${t.id}" title="删除">×</button>
      </div>`;
    });
  }

  content.innerHTML=html;

  // bind
  const addBtn=document.getElementById('addTaskBtn');
  if(addBtn)addBtn.addEventListener('click',()=>openModal(key));
  content.querySelectorAll('.task-check').forEach(el=>{
    el.addEventListener('click',(e)=>{e.stopPropagation();toggleTask(key,el.dataset.id);});
  });
  content.querySelectorAll('.task-del').forEach(el=>{
    el.addEventListener('click',(e)=>{e.stopPropagation();deleteTask(key,el.dataset.id);});
  });
  content.querySelectorAll('.task-item').forEach(el=>{
    el.addEventListener('click',()=>{
      const t=tasks.find(x=>x.id===el.dataset.id);
      if(t)openModal(key,t);
    });
  });
}

function typeLabel(t){return{ecommerce:'电商大促',marketing:'品牌营销',content:'小红书内容',festival:'节日节点',reminder:'任务提醒'}[t]||t;}
function remindLabel(r){return{'on-time':'准时','1day':'提前1天','3day':'提前3天'}[r]||r;}
function shorten(s,n){return s.length>n?s.slice(0,n)+'…':s;}

/* ---------- 8. 节点 CRUD ---------- */
function openModal(key,existingTask){
  editingTaskId=existingTask?existingTask.id:null;
  document.getElementById('modalTitle').textContent=existingTask?'编辑节点':'新建节点';
  document.getElementById('taskTitle').value=existingTask?existingTask.title:'';
  document.getElementById('taskDate').value=existingTask?existingTask.date:(key||'');
  document.getElementById('taskTime').value=existingTask?existingTask.time||'':'';
  document.getElementById('taskNote').value=existingTask?existingTask.note||'':'';
  document.getElementById('taskRemind').value=existingTask?existingTask.remind||'none':'none';
  document.getElementById('taskImportant').checked=existingTask?!!existingTask.important:false;
  setActiveType(existingTask?existingTask.type:'reminder');
  document.getElementById('taskModal').classList.add('show');
  setTimeout(()=>document.getElementById('taskTitle').focus(),100);
}
function closeModal(){
  document.getElementById('taskModal').classList.remove('show');
  editingTaskId=null;
}
function setActiveType(type){
  document.querySelectorAll('.type-chip').forEach(c=>{
    c.classList.toggle('active',c.dataset.type===type);
  });
  document.getElementById('taskModal').dataset.type=type;
}

async function saveTask(e){
  e.preventDefault();
  const date=document.getElementById('taskDate').value;
  if(!date)return;
  const type=document.getElementById('taskModal').dataset.type;
  const title=document.getElementById('taskTitle').value.trim();
  if(!title)return;
  const important=document.getElementById('taskImportant').checked;
  const action=editingTaskId?'update':'create';
  const event={
    id:editingTaskId||('local_'+Date.now()),
    date,
    title,
    type,
    time:document.getElementById('taskTime').value,
    note:document.getElementById('taskNote').value.trim(),
    remind:document.getElementById('taskRemind').value,
    important,
    created_by:currentUser||'匿名',
    done:false
  };

  // remove from old date if editing & date changed
  if(editingTaskId){
    for(const k in userEvents){
      userEvents[k]=userEvents[k].filter(t=>t.id!==editingTaskId);
      if(userEvents[k].length===0)delete userEvents[k];
    }
  }

  // cloud save (gets real id)
  if(isCloud()){
    try{
      const realId=await saveCloudEvent(event);
      event.id=realId;
    }catch(e){/* local fallback already in memory */}
  }

  if(!userEvents[date])userEvents[date]=[];
  const idx=userEvents[date].findIndex(t=>t.id===event.id);
  if(idx>=0){event.done=userEvents[date][idx].done;userEvents[date][idx]=event;}
  else userEvents[date].push(event);

  saveEvents(userEvents);
  closeModal();
  selectedDate=date;
  currentYear=parseInt(date.split('-')[0]);
  currentMonth=parseInt(date.split('-')[1])-1;
  renderCalendar();
  renderDetail(date);

  // 重要节点变更 → 钉钉通知
  if(important&&isCloud()){
    sendDingTalk(action,event);
  }
}

async function deleteTask(key,id){
  if(!confirm('确定删除该节点？'))return;
  const ev=(userEvents[key]||[]).find(t=>t.id===id);
  if(isCloud())await deleteCloudEvent(id);
  for(const k in userEvents){
    userEvents[k]=userEvents[k].filter(t=>t.id!==id);
    if(userEvents[k].length===0)delete userEvents[k];
  }
  saveEvents(userEvents);
  renderCalendar();
  if(selectedDate)renderDetail(selectedDate);
  // 删除重要节点 → 钉钉通知
  if(ev&&ev.important&&isCloud()){
    sendDingTalk('delete',ev);
  }
}

async function toggleTask(key,id){
  const t=(userEvents[key]||[]).find(x=>x.id===id);
  if(!t)return;
  t.done=!t.done;
  if(isCloud()){try{await saveCloudEvent(t);}catch(e){}}
  saveEvents(userEvents);
  renderDetail(key);
  renderCalendar();
}

/* ---------- 9. 时间线视图 ---------- */
function renderTimeline(){
  const view=document.getElementById('timelineView');
  let html='';
  for(let m=0;m<12;m++){
    const monthEvents=MARKETING_EVENTS.filter(e=>{
      const mm=parseInt(e.date.split('-')[1],10)-1;
      return mm===m;
    });
    const monthName=['一月','二月','三月','四月','五月','六月','七月','八月','九月','十月','十一月','十二月'][m];
    // count big events
    const bigCount=monthEvents.filter(e=>e.type==='ecommerce').length;
    html+=`<div class="timeline-month">
      <div class="timeline-month-head">
        <span class="tm-num">${String(m+1).padStart(2,'0')}</span>
        <span class="tm-name">${monthName}</span>
        <span class="tm-tag">${monthEvents.length} 个节点 · ${bigCount} 个大促</span>
      </div>`;
    // group by date
    const byDate={};
    monthEvents.forEach(e=>{
      if(!byDate[e.date])byDate[e.date]=[];
      byDate[e.date].push(e);
    });
    const sortedDates=Object.keys(byDate).sort();
    sortedDates.forEach(date=>{
      const [yy,mm,dd]=date.split('-');
      const items=byDate[date];
      html+=`<div class="timeline-row">
        <div class="tr-date">${parseInt(mm)}/${parseInt(dd)}</div>
        <div class="tr-chips">
          ${items.map(it=>`<span class="tr-chip chip-${it.type}" title="${it.note||''}">${it.title}</span>`).join('')}
        </div>
      </div>`;
    });
    html+='</div>';
  }
  view.innerHTML=html;
}

/* ---------- 10. 视图切换 & 导航 ---------- */
function switchView(view){
  currentView=view;
  document.querySelectorAll('.view-btn').forEach(b=>b.classList.toggle('active',b.dataset.view===view));
  document.getElementById('calendarView').classList.toggle('active',view==='month');
  document.getElementById('timelineView').classList.toggle('active',view==='timeline');
  if(view==='timeline')renderTimeline();
}

document.getElementById('prevMonth').addEventListener('click',()=>{
  currentMonth--;
  if(currentMonth<0){currentMonth=11;currentYear--;}
  renderCalendar();
});
document.getElementById('nextMonth').addEventListener('click',()=>{
  currentMonth++;
  if(currentMonth>11){currentMonth=0;currentYear++;}
  renderCalendar();
});
document.getElementById('todayBtn').addEventListener('click',()=>{
  const t=new Date();
  currentYear=t.getFullYear();
  currentMonth=t.getMonth();
  selectedDate=dateKey(t.getFullYear(),t.getMonth()+1,t.getDate());
  renderCalendar();
  renderDetail(selectedDate);
});

document.querySelectorAll('.view-btn').forEach(b=>{
  b.addEventListener('click',()=>switchView(b.dataset.view));
});

/* ---------- 11. 模态框事件 ---------- */
document.querySelectorAll('.type-chip').forEach(c=>{
  c.addEventListener('click',()=>setActiveType(c.dataset.type));
});
document.getElementById('taskForm').addEventListener('submit',saveTask);
document.getElementById('modalClose').addEventListener('click',closeModal);
document.getElementById('cancelBtn').addEventListener('click',closeModal);
document.getElementById('taskModal').addEventListener('click',e=>{
  if(e.target.id==='taskModal')closeModal();
});

/* ---------- 全局添加节点 ---------- */
document.getElementById('globalAddBtn').addEventListener('click',()=>{
  const today=new Date();
  const key=selectedDate||dateKey(today.getFullYear(),today.getMonth()+1,today.getDate());
  openModal(key);
});

/* ---------- 云同步 ---------- */
const cloudBtn=document.getElementById('cloudBtn');
function updateCloudBtn(){
  cloudBtn.classList.toggle('connected',isCloud());
  cloudBtn.textContent=isCloud()?'☁ 已同步':'☁ 云同步';
}
function openCloudModal(){
  document.getElementById('supabaseUrl').value=cloudConfig?.url||'';
  document.getElementById('supabaseKey').value=cloudConfig?.key||'';
  document.getElementById('dingWebhook').value=dingtalkConfig.webhook||'';
  document.getElementById('dingSecret').value=dingtalkConfig.secret||'';
  document.getElementById('dingMobiles').value=dingtalkConfig.atMobiles||'';
  document.getElementById('dingAtAll').checked=!!dingtalkConfig.atAll;
  document.getElementById('cloudStatus').textContent='';
  document.getElementById('cloudModal').classList.add('show');
}
cloudBtn.addEventListener('click',openCloudModal);
document.getElementById('cloudClose').addEventListener('click',()=>document.getElementById('cloudModal').classList.remove('show'));
document.getElementById('cloudCancel').addEventListener('click',()=>document.getElementById('cloudModal').classList.remove('show'));
document.getElementById('cloudModal').addEventListener('click',e=>{
  if(e.target.id==='cloudModal')document.getElementById('cloudModal').classList.remove('show');
});

document.getElementById('cloudSave').addEventListener('click',async()=>{
  const url=document.getElementById('supabaseUrl').value.trim().replace(/\/$/,'');
  const key=document.getElementById('supabaseKey').value.trim();
  const status=document.getElementById('cloudStatus');
  if(!url||!key){status.textContent='请填写 URL 和 key';status.className='cloud-status err';return;}
  cloudConfig={url,key};
  localStorage.setItem(CLOUD_KEY,JSON.stringify(cloudConfig));
  status.textContent='正在同步云端数据…';status.className='cloud-status ok';
  await loadCloudEvents();
  await saveAppConfig();
  await loadAppConfig();
  if(!status.textContent.startsWith('云端读取失败')&&!status.textContent.startsWith('钉钉配置保存失败')){
    status.textContent='✓ 同步成功！团队共享节点数据'+(dingtalkConfig.webhook?'，钉钉通知已启用':'');
  }
  updateCloudBtn();
  startSync();
  updateSyncIndicator();
  checkAcceptanceReminders();
  renderCalendar();
  if(selectedDate)renderDetail(selectedDate);
});

document.getElementById('cloudDisconnect').addEventListener('click',()=>{
  if(!confirm('确定断开云端同步？本地数据将保留。'))return;
  cloudConfig=null;
  localStorage.removeItem(CLOUD_KEY);
  if(pollTimer){clearInterval(pollTimer);pollTimer=null;}
  if(realtimeSocket){realtimeSocket.close();realtimeSocket=null;}
  updateCloudBtn();
  updateSyncIndicator();
  document.getElementById('cloudStatus').textContent='已断开云端同步';
  document.getElementById('cloudStatus').className='cloud-status';
});

// 设置操作人名称
function promptUserName(){
  if(currentUser)return;
  const name=prompt('请输入你的名字（用于标记节点操作人，同事可在钉钉通知中看到）：');
  if(name&&name.trim()){
    currentUser=name.trim();
    localStorage.setItem(USER_KEY,currentUser);
  }
}

/* ---------- 12. 初始化 ---------- */
(async function init(){
  const today=new Date();
  if(today.getFullYear()===2027){
    currentYear=2027;
    currentMonth=today.getMonth();
  }else{
    currentYear=2027;
    currentMonth=0;
  }
  updateCloudBtn();
  updateSyncIndicator();
  if(isCloud()){
    await loadCloudEvents();
    await loadAppConfig();
    startSync();
    checkAcceptanceReminders();
  }
  renderCalendar();
  // 延迟提示输入名字（避免阻塞首屏）
  setTimeout(promptUserName,800);
})();
