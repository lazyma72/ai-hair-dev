import { ServiceProto } from 'tsrpc-proto';
import { ReqAdd, ResAdd } from './admin/file/PtlAdd';
import { ReqUpdate, ResUpdate } from './admin/file/PtlUpdate';
import { ReqGetDetail, ResGetDetail } from './admin/ratio/PtlGetDetail';
import { ReqGetList, ResGetList } from './admin/ratio/PtlGetList';
import { ReqUpdate as ReqUpdate_1, ResUpdate as ResUpdate_1 } from './admin/ratio/PtlUpdate';
import { ReqGetDetail as ReqGetDetail_1, ResGetDetail as ResGetDetail_1 } from './file/PtlGetDetail';
import { ReqGetList as ReqGetList_1, ResGetList as ResGetList_1 } from './file/PtlGetList';

export interface ServiceType {
    api: {
        "admin/file/Add": {
            req: ReqAdd,
            res: ResAdd
        },
        "admin/file/Update": {
            req: ReqUpdate,
            res: ResUpdate
        },
        "admin/ratio/GetDetail": {
            req: ReqGetDetail,
            res: ResGetDetail
        },
        "admin/ratio/GetList": {
            req: ReqGetList,
            res: ResGetList
        },
        "admin/ratio/Update": {
            req: ReqUpdate_1,
            res: ResUpdate_1
        },
        "file/GetDetail": {
            req: ReqGetDetail_1,
            res: ResGetDetail_1
        },
        "file/GetList": {
            req: ReqGetList_1,
            res: ResGetList_1
        }
    },
    msg: {

    }
}

export const serviceProto: ServiceProto<ServiceType> = {
    "version": 3,
    "services": [
        {
            "id": 2,
            "name": "admin/file/Add",
            "type": "api",
            "conf": {}
        },
        {
            "id": 3,
            "name": "admin/file/Update",
            "type": "api",
            "conf": {}
        },
        {
            "id": 4,
            "name": "admin/ratio/GetDetail",
            "type": "api",
            "conf": {
                "allowNoLogin": true
            }
        },
        {
            "id": 5,
            "name": "admin/ratio/GetList",
            "type": "api",
            "conf": {
                "allowNoLogin": true
            }
        },
        {
            "id": 6,
            "name": "admin/ratio/Update",
            "type": "api",
            "conf": {}
        },
        {
            "id": 7,
            "name": "file/GetDetail",
            "type": "api",
            "conf": {
                "allowNoLogin": true
            }
        },
        {
            "id": 8,
            "name": "file/GetList",
            "type": "api",
            "conf": {
                "allowNoLogin": true
            }
        }
    ],
    "types": {
        "admin/file/PtlAdd/ReqAdd": {
            "type": "Interface",
            "extends": [
                {
                    "id": 0,
                    "type": {
                        "type": "Reference",
                        "target": "base/BaseRequest"
                    }
                }
            ],
            "properties": [
                {
                    "id": 0,
                    "name": "file",
                    "type": {
                        "type": "Reference",
                        "target": "../db/Db沐茵丝假发成品稿/沐茵丝假发成品稿"
                    }
                }
            ]
        },
        "base/BaseRequest": {
            "type": "Interface",
            "properties": [
                {
                    "id": 0,
                    "name": "userToken",
                    "type": {
                        "type": "String"
                    },
                    "optional": true
                }
            ]
        },
        "../db/Db沐茵丝假发成品稿/沐茵丝假发成品稿": {
            "type": "Interface",
            "properties": [
                {
                    "id": 0,
                    "name": "_id",
                    "type": {
                        "type": "String"
                    }
                },
                {
                    "id": 1,
                    "name": "假发类型",
                    "type": {
                        "type": "Reference",
                        "target": "../db/Db沐茵丝假发成品稿/假发类型"
                    }
                },
                {
                    "id": 2,
                    "name": "客户",
                    "type": {
                        "type": "String"
                    }
                },
                {
                    "id": 3,
                    "name": "品名",
                    "type": {
                        "type": "String"
                    }
                },
                {
                    "id": 4,
                    "name": "原材料",
                    "type": {
                        "type": "String"
                    }
                },
                {
                    "id": 5,
                    "name": "CAP",
                    "type": {
                        "type": "String"
                    }
                },
                {
                    "id": 7,
                    "name": "制品规格书",
                    "type": {
                        "type": "Reference",
                        "target": "../db/Db沐茵丝假发成品稿/制品规格书"
                    }
                },
                {
                    "id": 8,
                    "name": "高针指示单",
                    "type": {
                        "type": "Reference",
                        "target": "../db/Db沐茵丝假发成品稿/高针指示单"
                    }
                },
                {
                    "id": 9,
                    "name": "手织指示单",
                    "type": {
                        "type": "Reference",
                        "target": "../db/Db沐茵丝假发成品稿/手织指示单"
                    }
                },
                {
                    "id": 10,
                    "name": "头型图片",
                    "type": {
                        "type": "Array",
                        "elementType": {
                            "type": "String"
                        }
                    }
                }
            ]
        },
        "../db/Db沐茵丝假发成品稿/假发类型": {
            "type": "Enum",
            "members": [
                {
                    "id": 0,
                    "value": "间色"
                },
                {
                    "id": 1,
                    "value": "纯色"
                },
                {
                    "id": 2,
                    "value": "上下分"
                }
            ]
        },
        "../db/Db沐茵丝假发成品稿/制品规格书": {
            "type": "Interface",
            "properties": [
                {
                    "id": 7,
                    "name": "尺寸",
                    "type": {
                        "type": "String"
                    }
                },
                {
                    "id": 0,
                    "name": "机器规格清单",
                    "type": {
                        "type": "Array",
                        "elementType": {
                            "type": "Interface",
                            "properties": [
                                {
                                    "id": 0,
                                    "name": "档位",
                                    "type": {
                                        "type": "String"
                                    }
                                },
                                {
                                    "id": 1,
                                    "name": "DML比值",
                                    "type": {
                                        "type": "Interface",
                                        "properties": [
                                            {
                                                "id": 0,
                                                "name": "D",
                                                "type": {
                                                    "type": "Number"
                                                }
                                            },
                                            {
                                                "id": 1,
                                                "name": "M",
                                                "type": {
                                                    "type": "Number"
                                                },
                                                "optional": true
                                            },
                                            {
                                                "id": 2,
                                                "name": "L",
                                                "type": {
                                                    "type": "Number"
                                                },
                                                "optional": true
                                            }
                                        ]
                                    },
                                    "optional": true
                                },
                                {
                                    "id": 2,
                                    "name": "裁断与重量",
                                    "type": {
                                        "type": "Array",
                                        "elementType": {
                                            "type": "Reference",
                                            "target": "../db/Db沐茵丝假发成品稿/裁断重量项"
                                        }
                                    }
                                },
                                {
                                    "id": 3,
                                    "name": "整毛",
                                    "type": {
                                        "type": "Interface",
                                        "properties": [
                                            {
                                                "id": 0,
                                                "name": "拉尖",
                                                "type": {
                                                    "type": "Number"
                                                }
                                            },
                                            {
                                                "id": 1,
                                                "name": "对裁",
                                                "type": {
                                                    "type": "Number"
                                                },
                                                "optional": true
                                            }
                                        ]
                                    }
                                },
                                {
                                    "id": 4,
                                    "name": "双针",
                                    "type": {
                                        "type": "Interface",
                                        "properties": [
                                            {
                                                "id": 0,
                                                "name": "毛长",
                                                "type": {
                                                    "type": "Number"
                                                }
                                            },
                                            {
                                                "id": 1,
                                                "name": "尺数",
                                                "type": {
                                                    "type": "Interface",
                                                    "properties": [
                                                        {
                                                            "id": 0,
                                                            "name": "D",
                                                            "type": {
                                                                "type": "Number"
                                                            }
                                                        },
                                                        {
                                                            "id": 1,
                                                            "name": "M",
                                                            "type": {
                                                                "type": "Number"
                                                            },
                                                            "optional": true
                                                        },
                                                        {
                                                            "id": 2,
                                                            "name": "L",
                                                            "type": {
                                                                "type": "Number"
                                                            },
                                                            "optional": true
                                                        }
                                                    ]
                                                }
                                            },
                                            {
                                                "id": 2,
                                                "name": "密度",
                                                "type": {
                                                    "type": "Number"
                                                }
                                            }
                                        ]
                                    }
                                },
                                {
                                    "id": 5,
                                    "name": "形态",
                                    "type": {
                                        "type": "String"
                                    },
                                    "optional": true
                                },
                                {
                                    "id": 6,
                                    "name": "美容",
                                    "type": {
                                        "type": "Interface",
                                        "properties": [
                                            {
                                                "id": 0,
                                                "name": "铝管",
                                                "type": {
                                                    "type": "Number"
                                                }
                                            },
                                            {
                                                "id": 1,
                                                "name": "方向",
                                                "type": {
                                                    "type": "String"
                                                }
                                            },
                                            {
                                                "id": 2,
                                                "name": "层数",
                                                "type": {
                                                    "type": "Number"
                                                }
                                            }
                                        ]
                                    }
                                },
                                {
                                    "id": 7,
                                    "name": "备注",
                                    "type": {
                                        "type": "String"
                                    },
                                    "optional": true
                                },
                                {
                                    "id": 8,
                                    "name": "染色",
                                    "type": {
                                        "type": "Interface",
                                        "properties": [
                                            {
                                                "id": 0,
                                                "name": "比例",
                                                "type": {
                                                    "type": "Number"
                                                }
                                            },
                                            {
                                                "id": 1,
                                                "name": "对折",
                                                "type": {
                                                    "type": "Boolean"
                                                }
                                            }
                                        ]
                                    },
                                    "optional": true
                                }
                            ]
                        }
                    }
                },
                {
                    "id": 1,
                    "name": "人工规格清单",
                    "type": {
                        "type": "Array",
                        "elementType": {
                            "type": "Interface",
                            "properties": [
                                {
                                    "id": 0,
                                    "name": "档位",
                                    "type": {
                                        "type": "String"
                                    }
                                },
                                {
                                    "id": 1,
                                    "name": "裁断",
                                    "type": {
                                        "type": "Number"
                                    }
                                },
                                {
                                    "id": 2,
                                    "name": "整毛",
                                    "type": {
                                        "type": "Number"
                                    }
                                },
                                {
                                    "id": 3,
                                    "name": "双针",
                                    "type": {
                                        "type": "Interface",
                                        "properties": [
                                            {
                                                "id": 0,
                                                "name": "毛长",
                                                "type": {
                                                    "type": "Number"
                                                }
                                            },
                                            {
                                                "id": 1,
                                                "name": "磅发",
                                                "type": {
                                                    "type": "Number"
                                                }
                                            }
                                        ]
                                    }
                                },
                                {
                                    "id": 4,
                                    "name": "形态",
                                    "type": {
                                        "type": "String"
                                    },
                                    "optional": true
                                },
                                {
                                    "id": 5,
                                    "name": "美容",
                                    "type": {
                                        "type": "Interface",
                                        "properties": [
                                            {
                                                "id": 0,
                                                "name": "铝管",
                                                "type": {
                                                    "type": "Number"
                                                }
                                            }
                                        ]
                                    }
                                },
                                {
                                    "id": 6,
                                    "name": "备注",
                                    "type": {
                                        "type": "String"
                                    },
                                    "optional": true
                                },
                                {
                                    "id": 7,
                                    "name": "染色",
                                    "type": {
                                        "type": "Interface",
                                        "properties": [
                                            {
                                                "id": 0,
                                                "name": "比例",
                                                "type": {
                                                    "type": "Number"
                                                }
                                            },
                                            {
                                                "id": 1,
                                                "name": "对折",
                                                "type": {
                                                    "type": "Boolean"
                                                }
                                            }
                                        ]
                                    },
                                    "optional": true
                                }
                            ]
                        }
                    }
                },
                {
                    "id": 2,
                    "name": "胶丝比例列表",
                    "type": {
                        "type": "Array",
                        "elementType": {
                            "type": "Interface",
                            "properties": [
                                {
                                    "id": 0,
                                    "name": "颜色编号",
                                    "type": {
                                        "type": "String"
                                    }
                                },
                                {
                                    "id": 1,
                                    "name": "线色",
                                    "type": {
                                        "type": "String"
                                    }
                                }
                            ]
                        }
                    }
                },
                {
                    "id": 3,
                    "name": "制帽",
                    "type": {
                        "type": "Interface",
                        "properties": [
                            {
                                "id": 0,
                                "name": "帽围",
                                "type": {
                                    "type": "Number"
                                }
                            },
                            {
                                "id": 1,
                                "name": "帽深",
                                "type": {
                                    "type": "Number"
                                }
                            },
                            {
                                "id": 2,
                                "name": "前后",
                                "type": {
                                    "type": "Number"
                                }
                            },
                            {
                                "id": 3,
                                "name": "唛头",
                                "type": {
                                    "type": "String"
                                }
                            },
                            {
                                "id": 4,
                                "name": "号码",
                                "type": {
                                    "type": "String"
                                }
                            }
                        ]
                    }
                },
                {
                    "id": 4,
                    "name": "工艺说明",
                    "type": {
                        "type": "Array",
                        "elementType": {
                            "type": "Interface",
                            "properties": [
                                {
                                    "id": 0,
                                    "name": "作业方法",
                                    "type": {
                                        "type": "String"
                                    }
                                },
                                {
                                    "id": 1,
                                    "name": "整毛",
                                    "type": {
                                        "type": "String"
                                    }
                                },
                                {
                                    "id": 2,
                                    "name": "双针",
                                    "type": {
                                        "type": "String"
                                    }
                                },
                                {
                                    "id": 3,
                                    "name": "美容",
                                    "type": {
                                        "type": "String"
                                    }
                                },
                                {
                                    "id": 4,
                                    "name": "制帽",
                                    "type": {
                                        "type": "String"
                                    }
                                },
                                {
                                    "id": 5,
                                    "name": "手织",
                                    "type": {
                                        "type": "String"
                                    }
                                },
                                {
                                    "id": 6,
                                    "name": "高针",
                                    "type": {
                                        "type": "String"
                                    }
                                },
                                {
                                    "id": 7,
                                    "name": "完成",
                                    "type": {
                                        "type": "String"
                                    }
                                },
                                {
                                    "id": 8,
                                    "name": "包装",
                                    "type": {
                                        "type": "String"
                                    }
                                }
                            ],
                            "indexSignature": {
                                "keyType": "String",
                                "type": {
                                    "type": "String"
                                }
                            }
                        }
                    }
                },
                {
                    "id": 5,
                    "name": "工程重量",
                    "type": {
                        "type": "Interface",
                        "properties": [
                            {
                                "id": 0,
                                "name": "整毛",
                                "type": {
                                    "type": "Interface",
                                    "properties": [
                                        {
                                            "id": 0,
                                            "name": "加减",
                                            "type": {
                                                "type": "Number"
                                            }
                                        }
                                    ]
                                },
                                "optional": true
                            },
                            {
                                "id": 1,
                                "name": "双针",
                                "type": {
                                    "type": "Interface",
                                    "properties": [
                                        {
                                            "id": 0,
                                            "name": "加减",
                                            "type": {
                                                "type": "Number"
                                            }
                                        }
                                    ]
                                },
                                "optional": true
                            },
                            {
                                "id": 2,
                                "name": "美容",
                                "type": {
                                    "type": "Interface",
                                    "properties": [
                                        {
                                            "id": 0,
                                            "name": "加减",
                                            "type": {
                                                "type": "Number"
                                            }
                                        }
                                    ]
                                },
                                "optional": true
                            },
                            {
                                "id": 3,
                                "name": "SKIN",
                                "type": {
                                    "type": "Interface",
                                    "properties": [
                                        {
                                            "id": 0,
                                            "name": "加减",
                                            "type": {
                                                "type": "Number"
                                            }
                                        }
                                    ]
                                },
                                "optional": true
                            },
                            {
                                "id": 4,
                                "name": "制帽",
                                "type": {
                                    "type": "Interface",
                                    "properties": [
                                        {
                                            "id": 0,
                                            "name": "加减",
                                            "type": {
                                                "type": "Number"
                                            }
                                        }
                                    ]
                                },
                                "optional": true
                            },
                            {
                                "id": 5,
                                "name": "高针",
                                "type": {
                                    "type": "Interface",
                                    "properties": [
                                        {
                                            "id": 0,
                                            "name": "加减",
                                            "type": {
                                                "type": "Number"
                                            }
                                        }
                                    ]
                                },
                                "optional": true
                            },
                            {
                                "id": 6,
                                "name": "手织",
                                "type": {
                                    "type": "Interface",
                                    "properties": [
                                        {
                                            "id": 0,
                                            "name": "加减",
                                            "type": {
                                                "type": "Number"
                                            }
                                        }
                                    ]
                                },
                                "optional": true
                            },
                            {
                                "id": 7,
                                "name": "剪驳",
                                "type": {
                                    "type": "Interface",
                                    "properties": [
                                        {
                                            "id": 0,
                                            "name": "加减",
                                            "type": {
                                                "type": "Number"
                                            }
                                        }
                                    ]
                                },
                                "optional": true
                            },
                            {
                                "id": 8,
                                "name": "发网",
                                "type": {
                                    "type": "Interface",
                                    "properties": [
                                        {
                                            "id": 0,
                                            "name": "加减",
                                            "type": {
                                                "type": "Number"
                                            }
                                        }
                                    ]
                                },
                                "optional": true
                            }
                        ]
                    }
                },
                {
                    "id": 6,
                    "name": "染色档位映射图",
                    "type": {
                        "type": "Array",
                        "elementType": {
                            "type": "Interface",
                            "properties": [
                                {
                                    "id": 0,
                                    "name": "档位映射",
                                    "type": {
                                        "type": "Array",
                                        "elementType": {
                                            "type": "Interface",
                                            "properties": [
                                                {
                                                    "id": 0,
                                                    "name": "档位数组",
                                                    "type": {
                                                        "type": "Array",
                                                        "elementType": {
                                                            "type": "String"
                                                        }
                                                    }
                                                },
                                                {
                                                    "id": 1,
                                                    "name": "染色尺寸",
                                                    "type": {
                                                        "type": "String"
                                                    }
                                                },
                                                {
                                                    "id": 2,
                                                    "name": "染色尺寸图片",
                                                    "type": {
                                                        "type": "String"
                                                    }
                                                }
                                            ]
                                        }
                                    }
                                }
                            ]
                        }
                    }
                }
            ]
        },
        "../db/Db沐茵丝假发成品稿/裁断重量项": {
            "type": "Interface",
            "properties": [
                {
                    "id": 0,
                    "name": "裁断",
                    "type": {
                        "type": "Number"
                    }
                },
                {
                    "id": 1,
                    "name": "重量g",
                    "type": {
                        "type": "Reference",
                        "target": "../db/Db沐茵丝假发成品稿/DML重量"
                    },
                    "optional": true
                }
            ]
        },
        "../db/Db沐茵丝假发成品稿/DML重量": {
            "type": "Interface",
            "properties": [
                {
                    "id": 0,
                    "name": "D",
                    "type": {
                        "type": "Number"
                    }
                },
                {
                    "id": 1,
                    "name": "M",
                    "type": {
                        "type": "Number"
                    },
                    "optional": true
                },
                {
                    "id": 2,
                    "name": "L",
                    "type": {
                        "type": "Number"
                    },
                    "optional": true
                }
            ]
        },
        "../db/Db沐茵丝假发成品稿/高针指示单": {
            "type": "Interface",
            "properties": [
                {
                    "id": 2,
                    "name": "尺寸",
                    "type": {
                        "type": "String"
                    }
                },
                {
                    "id": 0,
                    "name": "注意事项",
                    "type": {
                        "type": "String"
                    }
                },
                {
                    "id": 1,
                    "name": "高针图",
                    "type": {
                        "type": "Reference",
                        "target": "../models/高针图/高针图"
                    }
                }
            ]
        },
        "../models/高针图/高针图": {
            "type": "Interface",
            "properties": [
                {
                    "id": 0,
                    "name": "底图",
                    "type": {
                        "type": "Interface",
                        "properties": [
                            {
                                "id": 0,
                                "name": "svg",
                                "type": {
                                    "type": "String"
                                }
                            },
                            {
                                "id": 1,
                                "name": "区域名",
                                "type": {
                                    "type": "Array",
                                    "elementType": {
                                        "type": "String"
                                    }
                                }
                            },
                            {
                                "id": 2,
                                "name": "区域线条",
                                "type": {
                                    "type": "Array",
                                    "elementType": {
                                        "type": "Interface",
                                        "properties": [
                                            {
                                                "id": 0,
                                                "name": "区域名",
                                                "type": {
                                                    "type": "String"
                                                }
                                            },
                                            {
                                                "id": 1,
                                                "name": "lineNodeIds",
                                                "type": {
                                                    "type": "Array",
                                                    "elementType": {
                                                        "type": "String"
                                                    }
                                                }
                                            },
                                            {
                                                "id": 2,
                                                "name": "lineLength",
                                                "type": {
                                                    "type": "Number"
                                                }
                                            }
                                        ]
                                    }
                                }
                            },
                            {
                                "id": 3,
                                "name": "区域DML标注",
                                "type": {
                                    "type": "Array",
                                    "elementType": {
                                        "type": "Interface",
                                        "properties": [
                                            {
                                                "id": 0,
                                                "name": "区域名",
                                                "type": {
                                                    "type": "String"
                                                }
                                            },
                                            {
                                                "id": 1,
                                                "name": "textNodeIds",
                                                "type": {
                                                    "type": "Array",
                                                    "elementType": {
                                                        "type": "String"
                                                    }
                                                }
                                            }
                                        ]
                                    }
                                }
                            },
                            {
                                "id": 4,
                                "name": "文本替换",
                                "type": {
                                    "type": "Interface",
                                    "indexSignature": {
                                        "keyType": "String",
                                        "type": {
                                            "type": "Interface",
                                            "properties": [
                                                {
                                                    "id": 0,
                                                    "name": "textNodeId",
                                                    "type": {
                                                        "type": "String"
                                                    }
                                                },
                                                {
                                                    "id": 1,
                                                    "name": "fontStyle",
                                                    "type": {
                                                        "type": "Interface"
                                                    },
                                                    "optional": true
                                                }
                                            ]
                                        }
                                    }
                                }
                            }
                        ]
                    }
                },
                {
                    "id": 1,
                    "name": "自定义数据",
                    "type": {
                        "type": "Interface",
                        "properties": [
                            {
                                "id": 0,
                                "name": "DML标注",
                                "type": {
                                    "type": "Array",
                                    "elementType": {
                                        "type": "Interface",
                                        "properties": [
                                            {
                                                "id": 0,
                                                "name": "标注序列",
                                                "type": {
                                                    "type": "Array",
                                                    "elementType": {
                                                        "type": "String"
                                                    }
                                                }
                                            },
                                            {
                                                "id": 1,
                                                "name": "标注区域",
                                                "type": {
                                                    "type": "Array",
                                                    "elementType": {
                                                        "type": "Interface",
                                                        "properties": [
                                                            {
                                                                "id": 0,
                                                                "name": "区域名",
                                                                "type": {
                                                                    "type": "String"
                                                                }
                                                            },
                                                            {
                                                                "id": 1,
                                                                "name": "起点位置",
                                                                "type": {
                                                                    "type": "Number"
                                                                }
                                                            },
                                                            {
                                                                "id": 2,
                                                                "name": "终点位置",
                                                                "type": {
                                                                    "type": "Number"
                                                                }
                                                            }
                                                        ]
                                                    }
                                                }
                                            }
                                        ]
                                    }
                                }
                            },
                            {
                                "id": 1,
                                "name": "文本替换",
                                "type": {
                                    "type": "Interface",
                                    "indexSignature": {
                                        "keyType": "String",
                                        "type": {
                                            "type": "Interface",
                                            "properties": [
                                                {
                                                    "id": 0,
                                                    "name": "text",
                                                    "type": {
                                                        "type": "String"
                                                    }
                                                },
                                                {
                                                    "id": 1,
                                                    "name": "fontStyle",
                                                    "type": {
                                                        "type": "Interface"
                                                    },
                                                    "optional": true
                                                }
                                            ]
                                        }
                                    }
                                }
                            }
                        ]
                    }
                }
            ]
        },
        "../db/Db沐茵丝假发成品稿/手织指示单": {
            "type": "Interface",
            "properties": [
                {
                    "id": 0,
                    "name": "尺寸",
                    "type": {
                        "type": "Number"
                    }
                },
                {
                    "id": 1,
                    "name": "手织图",
                    "type": {
                        "type": "Reference",
                        "target": "../models/手织图/手织图"
                    }
                },
                {
                    "id": 2,
                    "name": "注意事项",
                    "type": {
                        "type": "String"
                    }
                }
            ]
        },
        "../models/手织图/手织图": {
            "type": "Interface",
            "properties": [
                {
                    "id": 0,
                    "name": "底图",
                    "type": {
                        "type": "Interface",
                        "properties": [
                            {
                                "id": 0,
                                "name": "svg",
                                "type": {
                                    "type": "String"
                                }
                            },
                            {
                                "id": 1,
                                "name": "可定制项",
                                "type": {
                                    "type": "Array",
                                    "elementType": {
                                        "type": "Interface",
                                        "properties": [
                                            {
                                                "id": 0,
                                                "name": "lineId",
                                                "type": {
                                                    "type": "String"
                                                }
                                            },
                                            {
                                                "id": 1,
                                                "name": "尺数",
                                                "type": {
                                                    "type": "Number"
                                                }
                                            }
                                        ]
                                    }
                                }
                            }
                        ]
                    }
                }
            ]
        },
        "admin/file/PtlAdd/ResAdd": {
            "type": "Interface",
            "extends": [
                {
                    "id": 0,
                    "type": {
                        "type": "Reference",
                        "target": "base/BaseResponse"
                    }
                }
            ],
            "properties": [
                {
                    "id": 0,
                    "name": "id",
                    "type": {
                        "type": "String"
                    }
                }
            ]
        },
        "base/BaseResponse": {
            "type": "Interface"
        },
        "admin/file/PtlUpdate/ReqUpdate": {
            "type": "Interface",
            "extends": [
                {
                    "id": 0,
                    "type": {
                        "type": "Reference",
                        "target": "base/BaseRequest"
                    }
                }
            ]
        },
        "admin/file/PtlUpdate/ResUpdate": {
            "type": "Interface",
            "extends": [
                {
                    "id": 0,
                    "type": {
                        "type": "Reference",
                        "target": "base/BaseResponse"
                    }
                }
            ]
        },
        "admin/ratio/PtlGetDetail/ReqGetDetail": {
            "type": "Interface",
            "extends": [
                {
                    "id": 0,
                    "type": {
                        "type": "Reference",
                        "target": "base/BaseRequest"
                    }
                }
            ],
            "properties": [
                {
                    "id": 0,
                    "name": "id",
                    "type": {
                        "type": "String"
                    }
                }
            ]
        },
        "admin/ratio/PtlGetDetail/ResGetDetail": {
            "type": "Interface",
            "extends": [
                {
                    "id": 0,
                    "type": {
                        "type": "Reference",
                        "target": "base/BaseResponse"
                    }
                }
            ],
            "properties": [
                {
                    "id": 0,
                    "name": "胶丝比例",
                    "type": {
                        "type": "Reference",
                        "target": "../frontend/model/model/胶丝比例Frontend"
                    }
                }
            ]
        },
        "../frontend/model/model/胶丝比例Frontend": {
            "type": "Interface",
            "extends": [
                {
                    "id": 0,
                    "type": {
                        "target": {
                            "type": "Reference",
                            "target": "../db/Db胶丝比例/Db胶丝比例"
                        },
                        "keys": [
                            "颜色图片参考"
                        ],
                        "type": "Omit"
                    }
                }
            ],
            "properties": [
                {
                    "id": 0,
                    "name": "颜色图片参考",
                    "type": {
                        "type": "String"
                    },
                    "optional": true
                }
            ]
        },
        "../db/Db胶丝比例/Db胶丝比例": {
            "type": "Interface",
            "properties": [
                {
                    "id": 0,
                    "name": "_id",
                    "type": {
                        "type": "String"
                    }
                },
                {
                    "id": 1,
                    "name": "线色",
                    "type": {
                        "type": "String"
                    },
                    "optional": true
                },
                {
                    "id": 2,
                    "name": "D",
                    "type": {
                        "type": "Array",
                        "elementType": {
                            "type": "Reference",
                            "target": "../db/Db胶丝比例/KLS胶丝比例"
                        }
                    }
                },
                {
                    "id": 3,
                    "name": "M",
                    "type": {
                        "type": "Array",
                        "elementType": {
                            "type": "Reference",
                            "target": "../db/Db胶丝比例/KLS胶丝比例"
                        }
                    },
                    "optional": true
                },
                {
                    "id": 4,
                    "name": "L",
                    "type": {
                        "type": "Array",
                        "elementType": {
                            "type": "Reference",
                            "target": "../db/Db胶丝比例/KLS胶丝比例"
                        }
                    },
                    "optional": true
                },
                {
                    "id": 5,
                    "name": "颜色图片参考",
                    "type": {
                        "type": "Buffer",
                        "arrayType": "Uint8Array"
                    },
                    "optional": true
                },
                {
                    "id": 6,
                    "name": "备注",
                    "type": {
                        "type": "String"
                    },
                    "optional": true
                }
            ]
        },
        "../db/Db胶丝比例/KLS胶丝比例": {
            "type": "Interface",
            "properties": [
                {
                    "id": 0,
                    "name": "发丝种类",
                    "type": {
                        "type": "Reference",
                        "target": "../db/Db胶丝比例/Brand"
                    }
                },
                {
                    "id": 1,
                    "name": "色号",
                    "type": {
                        "type": "String"
                    }
                },
                {
                    "id": 2,
                    "name": "比例",
                    "type": {
                        "type": "Number"
                    }
                }
            ]
        },
        "../db/Db胶丝比例/Brand": {
            "type": "Enum",
            "members": [
                {
                    "id": 0,
                    "value": "KL'S"
                },
                {
                    "id": 1,
                    "value": "FU"
                }
            ]
        },
        "admin/ratio/PtlGetList/ReqGetList": {
            "type": "Interface",
            "extends": [
                {
                    "id": 0,
                    "type": {
                        "type": "Reference",
                        "target": "base/BaseRequest"
                    }
                }
            ]
        },
        "admin/ratio/PtlGetList/ResGetList": {
            "type": "Interface",
            "extends": [
                {
                    "id": 0,
                    "type": {
                        "type": "Reference",
                        "target": "base/BaseResponse"
                    }
                }
            ],
            "properties": [
                {
                    "id": 0,
                    "name": "list",
                    "type": {
                        "type": "Array",
                        "elementType": {
                            "type": "Reference",
                            "target": "../frontend/model/model/胶丝比例ListItem"
                        }
                    }
                }
            ]
        },
        "../frontend/model/model/胶丝比例ListItem": {
            "type": "Interface",
            "properties": [
                {
                    "id": 0,
                    "name": "_id",
                    "type": {
                        "type": "String"
                    }
                },
                {
                    "id": 1,
                    "name": "线色",
                    "type": {
                        "type": "String"
                    },
                    "optional": true
                }
            ]
        },
        "admin/ratio/PtlUpdate/ReqUpdate": {
            "type": "Interface",
            "extends": [
                {
                    "id": 0,
                    "type": {
                        "type": "Reference",
                        "target": "base/BaseRequest"
                    }
                }
            ]
        },
        "admin/ratio/PtlUpdate/ResUpdate": {
            "type": "Interface",
            "extends": [
                {
                    "id": 0,
                    "type": {
                        "type": "Reference",
                        "target": "base/BaseResponse"
                    }
                }
            ]
        },
        "file/PtlGetDetail/ReqGetDetail": {
            "type": "Interface",
            "extends": [
                {
                    "id": 0,
                    "type": {
                        "type": "Reference",
                        "target": "base/BaseRequest"
                    }
                }
            ],
            "properties": [
                {
                    "id": 0,
                    "name": "id",
                    "type": {
                        "type": "String"
                    }
                }
            ]
        },
        "file/PtlGetDetail/ResGetDetail": {
            "type": "Interface",
            "extends": [
                {
                    "id": 0,
                    "type": {
                        "type": "Reference",
                        "target": "base/BaseResponse"
                    }
                }
            ],
            "properties": [
                {
                    "id": 0,
                    "name": "file",
                    "type": {
                        "type": "Reference",
                        "target": "../frontend/model/model/沐茵丝假发成品稿Frontend"
                    }
                }
            ]
        },
        "../frontend/model/model/沐茵丝假发成品稿Frontend": {
            "type": "Interface",
            "properties": [
                {
                    "id": 0,
                    "name": "_id",
                    "type": {
                        "type": "String"
                    }
                },
                {
                    "id": 1,
                    "name": "制品规格书",
                    "type": {
                        "type": "Reference",
                        "target": "../frontend/model/model/制品规格书Frontend"
                    }
                },
                {
                    "id": 2,
                    "name": "高针指示单",
                    "type": {
                        "type": "Reference",
                        "target": "../frontend/model/model/高针指示单Frontend"
                    }
                },
                {
                    "id": 3,
                    "name": "手织指示单",
                    "type": {
                        "type": "Reference",
                        "target": "../frontend/model/model/手织指示单Frontend"
                    }
                }
            ]
        },
        "../frontend/model/model/制品规格书Frontend": {
            "type": "Interface",
            "properties": [
                {
                    "id": 0,
                    "name": "title",
                    "type": {
                        "type": "Interface",
                        "properties": [
                            {
                                "id": 0,
                                "name": "样品编号",
                                "type": {
                                    "type": "String"
                                }
                            },
                            {
                                "id": 1,
                                "name": "客户",
                                "type": {
                                    "type": "String"
                                }
                            },
                            {
                                "id": 2,
                                "name": "品名",
                                "type": {
                                    "type": "String"
                                }
                            },
                            {
                                "id": 3,
                                "name": "订单",
                                "type": {
                                    "type": "String"
                                }
                            },
                            {
                                "id": 4,
                                "name": "原料",
                                "type": {
                                    "type": "String"
                                }
                            },
                            {
                                "id": 5,
                                "name": "颜色编号",
                                "type": {
                                    "type": "String"
                                }
                            }
                        ]
                    }
                },
                {
                    "id": 1,
                    "name": "机器规格清单",
                    "type": {
                        "type": "IndexedAccess",
                        "index": "机器规格清单",
                        "objectType": {
                            "type": "Reference",
                            "target": "../db/Db沐茵丝假发成品稿/制品规格书"
                        }
                    }
                },
                {
                    "id": 2,
                    "name": "人工规格清单",
                    "type": {
                        "type": "IndexedAccess",
                        "index": "人工规格清单",
                        "objectType": {
                            "type": "Reference",
                            "target": "../db/Db沐茵丝假发成品稿/制品规格书"
                        }
                    }
                },
                {
                    "id": 3,
                    "name": "胶丝比例列表",
                    "type": {
                        "type": "Array",
                        "elementType": {
                            "type": "Reference",
                            "target": "../db/Db胶丝比例/Db胶丝比例"
                        }
                    }
                },
                {
                    "id": 4,
                    "name": "制帽",
                    "type": {
                        "type": "IndexedAccess",
                        "index": "制帽",
                        "objectType": {
                            "type": "Reference",
                            "target": "../db/Db沐茵丝假发成品稿/制品规格书"
                        }
                    }
                },
                {
                    "id": 5,
                    "name": "当前重量",
                    "type": {
                        "type": "Number"
                    }
                },
                {
                    "id": 6,
                    "name": "工程重量",
                    "type": {
                        "type": "Interface",
                        "properties": [
                            {
                                "id": 0,
                                "name": "整毛",
                                "type": {
                                    "type": "Interface",
                                    "properties": [
                                        {
                                            "id": 0,
                                            "name": "加减",
                                            "type": {
                                                "type": "Number"
                                            }
                                        },
                                        {
                                            "id": 1,
                                            "name": "数值",
                                            "type": {
                                                "type": "Number"
                                            }
                                        }
                                    ]
                                }
                            },
                            {
                                "id": 1,
                                "name": "双针",
                                "type": {
                                    "type": "Interface",
                                    "properties": [
                                        {
                                            "id": 0,
                                            "name": "加减",
                                            "type": {
                                                "type": "Number"
                                            }
                                        },
                                        {
                                            "id": 1,
                                            "name": "数值",
                                            "type": {
                                                "type": "Number"
                                            }
                                        }
                                    ]
                                }
                            },
                            {
                                "id": 2,
                                "name": "美容",
                                "type": {
                                    "type": "Interface",
                                    "properties": [
                                        {
                                            "id": 0,
                                            "name": "加减",
                                            "type": {
                                                "type": "Number"
                                            }
                                        },
                                        {
                                            "id": 1,
                                            "name": "数值",
                                            "type": {
                                                "type": "Number"
                                            }
                                        }
                                    ]
                                }
                            },
                            {
                                "id": 3,
                                "name": "SKIN",
                                "type": {
                                    "type": "Interface",
                                    "properties": [
                                        {
                                            "id": 0,
                                            "name": "加减",
                                            "type": {
                                                "type": "Number"
                                            }
                                        },
                                        {
                                            "id": 1,
                                            "name": "数值",
                                            "type": {
                                                "type": "Number"
                                            }
                                        }
                                    ]
                                }
                            },
                            {
                                "id": 4,
                                "name": "制帽",
                                "type": {
                                    "type": "Interface",
                                    "properties": [
                                        {
                                            "id": 0,
                                            "name": "加减",
                                            "type": {
                                                "type": "Number"
                                            }
                                        },
                                        {
                                            "id": 1,
                                            "name": "数值",
                                            "type": {
                                                "type": "Number"
                                            }
                                        }
                                    ]
                                }
                            },
                            {
                                "id": 5,
                                "name": "高针",
                                "type": {
                                    "type": "Interface",
                                    "properties": [
                                        {
                                            "id": 0,
                                            "name": "加减",
                                            "type": {
                                                "type": "Number"
                                            }
                                        },
                                        {
                                            "id": 1,
                                            "name": "数值",
                                            "type": {
                                                "type": "Number"
                                            }
                                        }
                                    ]
                                }
                            },
                            {
                                "id": 6,
                                "name": "手织",
                                "type": {
                                    "type": "Interface",
                                    "properties": [
                                        {
                                            "id": 0,
                                            "name": "加减",
                                            "type": {
                                                "type": "Number"
                                            }
                                        },
                                        {
                                            "id": 1,
                                            "name": "数值",
                                            "type": {
                                                "type": "Number"
                                            }
                                        }
                                    ]
                                }
                            },
                            {
                                "id": 7,
                                "name": "剪驳",
                                "type": {
                                    "type": "Interface",
                                    "properties": [
                                        {
                                            "id": 0,
                                            "name": "加减",
                                            "type": {
                                                "type": "Number"
                                            }
                                        },
                                        {
                                            "id": 1,
                                            "name": "数值",
                                            "type": {
                                                "type": "Number"
                                            }
                                        }
                                    ]
                                }
                            },
                            {
                                "id": 8,
                                "name": "发网",
                                "type": {
                                    "type": "Interface",
                                    "properties": [
                                        {
                                            "id": 0,
                                            "name": "加减",
                                            "type": {
                                                "type": "Number"
                                            }
                                        },
                                        {
                                            "id": 1,
                                            "name": "数值",
                                            "type": {
                                                "type": "Number"
                                            }
                                        }
                                    ]
                                }
                            },
                            {
                                "id": 9,
                                "name": "完成",
                                "type": {
                                    "type": "Interface",
                                    "properties": [
                                        {
                                            "id": 0,
                                            "name": "加减",
                                            "type": {
                                                "type": "Number"
                                            }
                                        },
                                        {
                                            "id": 1,
                                            "name": "数值",
                                            "type": {
                                                "type": "Number"
                                            }
                                        }
                                    ]
                                }
                            },
                            {
                                "id": 10,
                                "name": "重量",
                                "type": {
                                    "type": "String"
                                }
                            }
                        ]
                    }
                },
                {
                    "id": 7,
                    "name": "工艺说明",
                    "type": {
                        "type": "IndexedAccess",
                        "index": "工艺说明",
                        "objectType": {
                            "type": "Reference",
                            "target": "../db/Db沐茵丝假发成品稿/制品规格书"
                        }
                    }
                },
                {
                    "id": 8,
                    "name": "发型图片",
                    "type": {
                        "type": "Array",
                        "elementType": {
                            "type": "String"
                        }
                    }
                }
            ]
        },
        "../frontend/model/model/高针指示单Frontend": {
            "type": "Interface",
            "properties": [
                {
                    "id": 0,
                    "name": "title",
                    "type": {
                        "type": "Interface",
                        "properties": [
                            {
                                "id": 0,
                                "name": "客户",
                                "type": {
                                    "type": "String"
                                }
                            },
                            {
                                "id": 1,
                                "name": "重量",
                                "type": {
                                    "type": "String"
                                }
                            },
                            {
                                "id": 2,
                                "name": "品名",
                                "type": {
                                    "type": "String"
                                }
                            },
                            {
                                "id": 3,
                                "name": "尺寸",
                                "type": {
                                    "type": "String"
                                }
                            },
                            {
                                "id": 4,
                                "name": "原料",
                                "type": {
                                    "type": "String"
                                }
                            },
                            {
                                "id": 5,
                                "name": "CAP",
                                "type": {
                                    "type": "String"
                                }
                            },
                            {
                                "id": 6,
                                "name": "样品编号",
                                "type": {
                                    "type": "String"
                                }
                            }
                        ]
                    }
                },
                {
                    "id": 1,
                    "name": "高针图svg",
                    "type": {
                        "type": "String"
                    }
                },
                {
                    "id": 2,
                    "name": "机器规格清单_高针图",
                    "type": {
                        "type": "Array",
                        "elementType": {
                            "type": "Interface",
                            "properties": [
                                {
                                    "id": 0,
                                    "name": "档位",
                                    "type": {
                                        "type": "String"
                                    }
                                },
                                {
                                    "id": 1,
                                    "name": "毛长",
                                    "type": {
                                        "type": "Number"
                                    }
                                },
                                {
                                    "id": 2,
                                    "name": "长度",
                                    "type": {
                                        "type": "Interface",
                                        "properties": [
                                            {
                                                "id": 0,
                                                "name": "D",
                                                "type": {
                                                    "type": "Number"
                                                }
                                            },
                                            {
                                                "id": 1,
                                                "name": "M",
                                                "type": {
                                                    "type": "Number"
                                                },
                                                "optional": true
                                            },
                                            {
                                                "id": 2,
                                                "name": "L",
                                                "type": {
                                                    "type": "Number"
                                                },
                                                "optional": true
                                            }
                                        ]
                                    }
                                },
                                {
                                    "id": 3,
                                    "name": "形态",
                                    "type": {
                                        "type": "String"
                                    }
                                },
                                {
                                    "id": 4,
                                    "name": "管径",
                                    "type": {
                                        "type": "String"
                                    }
                                },
                                {
                                    "id": 5,
                                    "name": "方向",
                                    "type": {
                                        "type": "String"
                                    }
                                },
                                {
                                    "id": 6,
                                    "name": "备注",
                                    "type": {
                                        "type": "String"
                                    }
                                }
                            ]
                        }
                    }
                },
                {
                    "id": 3,
                    "name": "注意事项",
                    "type": {
                        "type": "String"
                    }
                },
                {
                    "id": 4,
                    "name": "发型图片",
                    "type": {
                        "type": "Array",
                        "elementType": {
                            "type": "String"
                        }
                    }
                }
            ]
        },
        "../frontend/model/model/手织指示单Frontend": {
            "type": "Interface",
            "properties": [
                {
                    "id": 0,
                    "name": "title",
                    "type": {
                        "type": "Interface",
                        "properties": [
                            {
                                "id": 0,
                                "name": "样品编号",
                                "type": {
                                    "type": "String"
                                }
                            },
                            {
                                "id": 1,
                                "name": "客户",
                                "type": {
                                    "type": "String"
                                }
                            },
                            {
                                "id": 2,
                                "name": "尺寸",
                                "type": {
                                    "type": "Number"
                                }
                            },
                            {
                                "id": 3,
                                "name": "品名",
                                "type": {
                                    "type": "String"
                                }
                            },
                            {
                                "id": 4,
                                "name": "CAP",
                                "type": {
                                    "type": "String"
                                }
                            },
                            {
                                "id": 5,
                                "name": "重量",
                                "type": {
                                    "type": "Number"
                                }
                            },
                            {
                                "id": 6,
                                "name": "原材料",
                                "type": {
                                    "type": "String"
                                }
                            },
                            {
                                "id": 7,
                                "name": "颜色编号",
                                "type": {
                                    "type": "String"
                                }
                            },
                            {
                                "id": 8,
                                "name": "针法",
                                "type": {
                                    "type": "String"
                                }
                            }
                        ]
                    }
                },
                {
                    "id": 1,
                    "name": "人工规格清单_手织图",
                    "type": {
                        "type": "Array",
                        "elementType": {
                            "type": "Interface",
                            "properties": [
                                {
                                    "id": 0,
                                    "name": "档位",
                                    "type": {
                                        "type": "String"
                                    }
                                },
                                {
                                    "id": 1,
                                    "name": "整长",
                                    "type": {
                                        "type": "String"
                                    }
                                },
                                {
                                    "id": 2,
                                    "name": "毛长",
                                    "type": {
                                        "type": "String"
                                    }
                                },
                                {
                                    "id": 3,
                                    "name": "重量",
                                    "type": {
                                        "type": "Interface",
                                        "properties": [
                                            {
                                                "id": 0,
                                                "name": "D",
                                                "type": {
                                                    "type": "Number"
                                                }
                                            },
                                            {
                                                "id": 1,
                                                "name": "M",
                                                "type": {
                                                    "type": "Number"
                                                },
                                                "optional": true
                                            },
                                            {
                                                "id": 2,
                                                "name": "L",
                                                "type": {
                                                    "type": "Number"
                                                },
                                                "optional": true
                                            }
                                        ]
                                    }
                                }
                            ]
                        }
                    }
                },
                {
                    "id": 2,
                    "name": "手织图片",
                    "type": {
                        "type": "String"
                    }
                }
            ]
        },
        "file/PtlGetList/ReqGetList": {
            "type": "Interface",
            "extends": [
                {
                    "id": 0,
                    "type": {
                        "type": "Reference",
                        "target": "base/BaseRequest"
                    }
                }
            ]
        },
        "file/PtlGetList/ResGetList": {
            "type": "Interface",
            "extends": [
                {
                    "id": 0,
                    "type": {
                        "type": "Reference",
                        "target": "base/BaseResponse"
                    }
                }
            ],
            "properties": [
                {
                    "id": 0,
                    "name": "list",
                    "type": {
                        "type": "Array",
                        "elementType": {
                            "type": "Reference",
                            "target": "../frontend/model/model/沐茵丝假发成品稿ListItem"
                        }
                    }
                }
            ]
        },
        "../frontend/model/model/沐茵丝假发成品稿ListItem": {
            "type": "Interface",
            "properties": [
                {
                    "id": 0,
                    "name": "_id",
                    "type": {
                        "type": "String"
                    }
                },
                {
                    "id": 1,
                    "name": "客户",
                    "type": {
                        "type": "String"
                    }
                },
                {
                    "id": 2,
                    "name": "品名",
                    "type": {
                        "type": "String"
                    }
                },
                {
                    "id": 3,
                    "name": "假发类型",
                    "type": {
                        "type": "Reference",
                        "target": "../db/Db沐茵丝假发成品稿/假发类型"
                    }
                },
                {
                    "id": 4,
                    "name": "CAP",
                    "type": {
                        "type": "String"
                    }
                }
            ]
        }
    }
};