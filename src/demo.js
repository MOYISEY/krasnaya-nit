export function demoGraph() {
  return {version:1,title:'Последний рейс «Чайки»',nodes:[
    {id:'arrival',type:'scene',title:'Пустой причал',summary:'«Чайка» вернулась без капитана. На причале остался мокрый дорожный сундук.',notes:'Начните с сундука и следов волочения. Дайте обе зацепки без броска, если герои осматривают причал.',status:'found',start:true,key:false,x:80,y:210},
    {id:'keeper',type:'person',title:'Смотритель Илья',summary:'Смотритель видел, как ночью погас маяк, а к старой насосной подошла лодка.',notes:'Илья боится портовой стражи. Разговор или помощь с ремонтом откроют путь к насосной.',status:'hidden',start:false,key:false,x:430,y:70},
    {id:'log',type:'scene',title:'Судовой журнал',summary:'Последняя запись: «Огонь не наш. Иду проверить насосную».',notes:'Журнал лежит в сундуке. Он даёт независимый путь, если группа не поговорит со смотрителем.',status:'hidden',start:false,key:false,x:430,y:350},
    {id:'pump',type:'place',title:'Старая насосная',summary:'У ворот свежие царапины. Внутри — следы связанного человека и запах лампового масла.',notes:'Здесь спрятана квитанция на масло со знаком восточного склада. Капитана уже увезли.',status:'hidden',start:false,key:false,x:800,y:210},
    {id:'signal',type:'conclusion',title:'Маяк подменили',summary:'Корабль заманили ложным огнём. Это было подготовлено заранее.',notes:'Ключевой промежуточный вывод. Обе ветки к насосной поддерживают его.',status:'hidden',start:false,key:true,x:1150,y:70},
    {id:'warehouse',type:'place',title:'Восточный склад',summary:'На складе слышен стук из запертой конторы. Рядом стоят те же бочки масла.',notes:'Капитан жив. Стражник склада работал на контрабандистов. Квитанция — единственная записанная связь к складу: добавьте резервную, если хотите.',status:'hidden',start:false,key:false,x:1150,y:350},
    {id:'rescue',type:'conclusion',title:'Капитана можно спасти',summary:'Капитан заперт в конторе восточного склада. Похитители вернутся на рассвете.',notes:'Финальный вывод. Не обязательно разыгрывать бой: переговоры, хитрость и тихое спасение подходят любой системе.',status:'hidden',start:false,key:true,x:1500,y:210},
    {id:'rumor',type:'person',title:'Гадалка у рынка',summary:'Гадалка слышала про бочки масла, которые возили ночью.',notes:'Необязательный резерв. Пока не связан со стартом. Добавьте путь с причала и к складу для устойчивости.',status:'hidden',start:false,key:false,x:800,y:520}
  ],edges:[
    {id:'e1',from:'arrival',to:'keeper',label:'Следы ведут к будке',status:'hidden'},
    {id:'e2',from:'arrival',to:'log',label:'Журнал в сундуке',status:'hidden'},
    {id:'e3',from:'keeper',to:'pump',label:'Рассказ о ночной лодке',status:'hidden'},
    {id:'e4',from:'log',to:'pump',label:'Адрес в последней записи',status:'hidden'},
    {id:'e5',from:'pump',to:'signal',label:'Лампа с линзой маяка',status:'hidden'},
    {id:'e6',from:'pump',to:'warehouse',label:'Квитанция на масло',status:'hidden'},
    {id:'e7',from:'warehouse',to:'rescue',label:'Стук из конторы',status:'hidden'}
  ]};
}
