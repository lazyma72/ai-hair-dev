import { ServiceProto } from 'tsrpc-proto';
import { ReqAdd, ResAdd } from './admin/customer/PtlAdd';
import { ReqGetList, ResGetList } from './admin/customer/PtlGetList';
import { ReqAdd as ReqAdd_1, ResAdd as ResAdd_1 } from './admin/file/PtlAdd';
import { ReqGetDetail, ResGetDetail } from './admin/file/PtlGetDetail';
import { ReqGetList as ReqGetList_1, ResGetList as ResGetList_1 } from './admin/file/PtlGetList';
import { ReqUpdate, ResUpdate } from './admin/file/PtlUpdate';
import { ReqGetPreview, ResGetPreview } from './admin/PtlGetPreview';
import { ReqGetDetail as ReqGetDetail_1, ResGetDetail as ResGetDetail_1 } from './admin/ratio/PtlGetDetail';
import { ReqGetList as ReqGetList_2, ResGetList as ResGetList_2 } from './admin/ratio/PtlGetList';
import { ReqUpdate as ReqUpdate_1, ResUpdate as ResUpdate_1 } from './admin/ratio/PtlUpdate';
import { ReqAdd as ReqAdd_2, ResAdd as ResAdd_2 } from './admin/user/PtlAdd';
import { ReqDelete, ResDelete } from './admin/user/PtlDelete';
import { ReqGetList as ReqGetList_3, ResGetList as ResGetList_3 } from './admin/user/PtlGetList';

export interface ServiceType {
    api: {
        "admin/customer/Add": {
            req: ReqAdd,
            res: ResAdd
        },
        "admin/customer/GetList": {
            req: ReqGetList,
            res: ResGetList
        },
        "admin/file/Add": {
            req: ReqAdd_1,
            res: ResAdd_1
        },
        "admin/file/GetDetail": {
            req: ReqGetDetail,
            res: ResGetDetail
        },
        "admin/file/GetList": {
            req: ReqGetList_1,
            res: ResGetList_1
        },
        "admin/file/Update": {
            req: ReqUpdate,
            res: ResUpdate
        },
        "admin/GetPreview": {
            req: ReqGetPreview,
            res: ResGetPreview
        },
        "admin/ratio/GetDetail": {
            req: ReqGetDetail_1,
            res: ResGetDetail_1
        },
        "admin/ratio/GetList": {
            req: ReqGetList_2,
            res: ResGetList_2
        },
        "admin/ratio/Update": {
            req: ReqUpdate_1,
            res: ResUpdate_1
        },
        "admin/user/Add": {
            req: ReqAdd_2,
            res: ResAdd_2
        },
        "admin/user/Delete": {
            req: ReqDelete,
            res: ResDelete
        },
        "admin/user/GetList": {
            req: ReqGetList_3,
            res: ResGetList_3
        }
    },
    msg: {

    }
}

export const serviceProto: ServiceProto<ServiceType> = {
    "version": 12,
    "services": [
        {
            "id": 9,
            "name": "admin/customer/Add",
            "type": "api",
            "conf": {}
        },
        {
            "id": 10,
            "name": "admin/customer/GetList",
            "type": "api",
            "conf": {
                "allowNoLogin": true
            }
        },
        {
            "id": 2,
            "name": "admin/file/Add",
            "type": "api",
            "conf": {}
        },
        {
            "id": 11,
            "name": "admin/file/GetDetail",
            "type": "api",
            "conf": {
                "allowNoLogin": true
            }
        },
        {
            "id": 12,
            "name": "admin/file/GetList",
            "type": "api",
            "conf": {
                "allowNoLogin": true
            }
        },
        {
            "id": 3,
            "name": "admin/file/Update",
            "type": "api",
            "conf": {}
        },
        {
            "id": 13,
            "name": "admin/GetPreview",
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
            "id": 14,
            "name": "admin/user/Add",
            "type": "api",
            "conf": {}
        },
        {
            "id": 15,
            "name": "admin/user/Delete",
            "type": "api",
            "conf": {}
        },
        {
            "id": 16,
            "name": "admin/user/GetList",
            "type": "api",
            "conf": {}
        }
    ],
    "types": {
        "admin/customer/PtlAdd/ReqAdd": {
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
                    "name": "客户编号",
                    "type": {
                        "type": "String"
                    }
                },
                {
                    "id": 1,
                    "name": "客户名称",
                    "type": {
                        "type": "String"
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
        "admin/customer/PtlAdd/ResAdd": {
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
        "admin/customer/PtlGetList/ReqGetList": {
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
                    "name": "keyword",
                    "type": {
                        "type": "String"
                    },
                    "optional": true
                }
            ]
        },
        "admin/customer/PtlGetList/ResGetList": {
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
                            "target": "../db/DbCustomer/DbCustomer"
                        }
                    }
                }
            ]
        },
        "../db/DbCustomer/DbCustomer": {
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
                    "name": "客户编号",
                    "type": {
                        "type": "String"
                    }
                },
                {
                    "id": 2,
                    "name": "客户名称",
                    "type": {
                        "type": "String"
                    }
                }
            ]
        },
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
                    "id": 11,
                    "name": "客户编号",
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
                    "id": 12,
                    "name": "染色档位列表",
                    "type": {
                        "type": "Array",
                        "elementType": {
                            "type": "Reference",
                            "target": "../db/Db沐茵丝假发成品稿/染色档位"
                        }
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
                },
                {
                    "id": 3,
                    "value": "单T色"
                }
            ]
        },
        "../db/Db沐茵丝假发成品稿/染色档位": {
            "type": "Union",
            "members": [
                {
                    "id": 0,
                    "type": {
                        "type": "Interface",
                        "properties": [
                            {
                                "id": 0,
                                "name": "type",
                                "type": {
                                    "type": "Literal",
                                    "literal": "普通"
                                }
                            },
                            {
                                "id": 1,
                                "name": "染色图",
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
                                            "name": "档位标注",
                                            "type": {
                                                "type": "Interface",
                                                "properties": [
                                                    {
                                                        "id": 0,
                                                        "name": "档位列表",
                                                        "type": {
                                                            "type": "Array",
                                                            "elementType": {
                                                                "type": "String"
                                                            }
                                                        }
                                                    },
                                                    {
                                                        "id": 1,
                                                        "name": "textNodeId",
                                                        "type": {
                                                            "type": "String"
                                                        }
                                                    }
                                                ]
                                            }
                                        },
                                        {
                                            "id": 2,
                                            "name": "染色尺寸标注",
                                            "type": {
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
                                                        "name": "textNodeId",
                                                        "type": {
                                                            "type": "String"
                                                        }
                                                    }
                                                ]
                                            }
                                        },
                                        {
                                            "id": 3,
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
                            }
                        ]
                    }
                },
                {
                    "id": 1,
                    "type": {
                        "type": "Interface",
                        "properties": [
                            {
                                "id": 0,
                                "name": "type",
                                "type": {
                                    "type": "Literal",
                                    "literal": "对折"
                                }
                            },
                            {
                                "id": 1,
                                "name": "染色图",
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
                                            "name": "档位标注",
                                            "type": {
                                                "type": "Interface",
                                                "properties": [
                                                    {
                                                        "id": 0,
                                                        "name": "档位列表",
                                                        "type": {
                                                            "type": "Array",
                                                            "elementType": {
                                                                "type": "String"
                                                            }
                                                        }
                                                    },
                                                    {
                                                        "id": 1,
                                                        "name": "textNodeId",
                                                        "type": {
                                                            "type": "String"
                                                        }
                                                    }
                                                ]
                                            }
                                        },
                                        {
                                            "id": 2,
                                            "name": "染色尺寸标注",
                                            "type": {
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
                                                        "name": "textNodeId",
                                                        "type": {
                                                            "type": "String"
                                                        }
                                                    }
                                                ]
                                            }
                                        },
                                        {
                                            "id": 3,
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
                            }
                        ]
                    }
                },
                {
                    "id": 2,
                    "type": {
                        "type": "Interface",
                        "properties": [
                            {
                                "id": 0,
                                "name": "type",
                                "type": {
                                    "type": "Literal",
                                    "literal": "错位"
                                }
                            },
                            {
                                "id": 1,
                                "name": "染色图",
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
                                            "name": "档位标注",
                                            "type": {
                                                "type": "Interface",
                                                "properties": [
                                                    {
                                                        "id": 0,
                                                        "name": "档位列表",
                                                        "type": {
                                                            "type": "Array",
                                                            "elementType": {
                                                                "type": "String"
                                                            }
                                                        }
                                                    },
                                                    {
                                                        "id": 1,
                                                        "name": "textNodeId",
                                                        "type": {
                                                            "type": "String"
                                                        }
                                                    }
                                                ]
                                            }
                                        },
                                        {
                                            "id": 2,
                                            "name": "染色尺寸标注",
                                            "type": {
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
                                                        "name": "textNodeId",
                                                        "type": {
                                                            "type": "String"
                                                        }
                                                    }
                                                ]
                                            }
                                        },
                                        {
                                            "id": 3,
                                            "name": "长尺寸标注",
                                            "type": {
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
                                                        "name": "textNodeId",
                                                        "type": {
                                                            "type": "String"
                                                        }
                                                    }
                                                ]
                                            }
                                        },
                                        {
                                            "id": 4,
                                            "name": "短尺寸标注",
                                            "type": {
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
                                                        "name": "textNodeId",
                                                        "type": {
                                                            "type": "String"
                                                        }
                                                    }
                                                ]
                                            },
                                            "optional": true
                                        },
                                        {
                                            "id": 5,
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
                            }
                        ]
                    }
                }
            ]
        },
        "../db/Db沐茵丝假发成品稿/制品规格书": {
            "type": "Interface",
            "properties": [
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
                                    "id": 2,
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
                                    "id": 8,
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
                                    "id": 9,
                                    "name": "位置",
                                    "type": {
                                        "type": "String"
                                    },
                                    "optional": true
                                }
                            ]
                        }
                    }
                },
                {
                    "id": 8,
                    "name": "胶丝比例id",
                    "type": {
                        "type": "IndexedAccess",
                        "index": "_id",
                        "objectType": {
                            "type": "Reference",
                            "target": "../db/Db胶丝比例/Db胶丝比例"
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
        "../db/Db胶丝比例/Db胶丝比例": {
            "type": "Interface",
            "properties": [
                {
                    "id": 0,
                    "name": "_id",
                    "type": {
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
                                "name": "发丝种类",
                                "type": {
                                    "type": "String"
                                }
                            }
                        ]
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
                        "type": "String"
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
        "../db/Db沐茵丝假发成品稿/高针指示单": {
            "type": "Interface",
            "properties": [
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
                                            },
                                            {
                                                "id": 3,
                                                "name": "区域内位置占比",
                                                "type": {
                                                    "type": "Number"
                                                }
                                            }
                                        ]
                                    }
                                }
                            },
                            {
                                "id": 6,
                                "name": "档位标注",
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
                                "id": 5,
                                "name": "文本节点",
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
                                                    "name": "text",
                                                    "type": {
                                                        "type": "String"
                                                    },
                                                    "optional": true
                                                },
                                                {
                                                    "id": 2,
                                                    "name": "created",
                                                    "type": {
                                                        "type": "Boolean"
                                                    },
                                                    "optional": true
                                                },
                                                {
                                                    "id": 3,
                                                    "name": "fontStyle",
                                                    "type": {
                                                        "type": "Interface",
                                                        "indexSignature": {
                                                            "keyType": "String",
                                                            "type": {
                                                                "type": "Any"
                                                            }
                                                        }
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
                                                "id": 2,
                                                "name": "lineNodeId",
                                                "type": {
                                                    "type": "String"
                                                }
                                            },
                                            {
                                                "id": 3,
                                                "name": "标注DML",
                                                "type": {
                                                    "type": "String"
                                                }
                                            },
                                            {
                                                "id": 4,
                                                "name": "textNodeId",
                                                "type": {
                                                    "type": "String"
                                                }
                                            }
                                        ]
                                    }
                                }
                            },
                            {
                                "id": 1,
                                "name": "单双标注",
                                "type": {
                                    "type": "Array",
                                    "elementType": {
                                        "type": "Interface",
                                        "properties": [
                                            {
                                                "id": 0,
                                                "name": "lineNodeId",
                                                "type": {
                                                    "type": "String"
                                                }
                                            },
                                            {
                                                "id": 1,
                                                "name": "双数",
                                                "type": {
                                                    "type": "Boolean"
                                                }
                                            },
                                            {
                                                "id": 2,
                                                "name": "textNodeId",
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
            ]
        },
        "../db/Db沐茵丝假发成品稿/手织指示单": {
            "type": "Interface",
            "properties": [
                {
                    "id": 1,
                    "name": "手织图",
                    "type": {
                        "type": "Interface",
                        "properties": [
                            {
                                "id": 0,
                                "name": "svg",
                                "type": {
                                    "type": "String"
                                }
                            }
                        ]
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
        "admin/file/PtlGetDetail/ReqGetDetail": {
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
        "admin/file/PtlGetDetail/ResGetDetail": {
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
                                "id": 6,
                                "name": "客户编号",
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
                },
                {
                    "id": 9,
                    "name": "染色档位列表",
                    "type": {
                        "type": "Array",
                        "elementType": {
                            "type": "Reference",
                            "target": "../db/Db沐茵丝假发成品稿/染色档位"
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
                                "id": 8,
                                "name": "客户编号",
                                "type": {
                                    "type": "String"
                                }
                            },
                            {
                                "id": 1,
                                "name": "重量",
                                "type": {
                                    "type": "Number"
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
                                "id": 9,
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
                    "id": 5,
                    "name": "高针图数据",
                    "type": {
                        "type": "Reference",
                        "target": "../models/高针图/高针图"
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
                                        "type": "Number"
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
                },
                {
                    "id": 6,
                    "name": "染色档位列表",
                    "type": {
                        "type": "Array",
                        "elementType": {
                            "type": "Reference",
                            "target": "../db/Db沐茵丝假发成品稿/染色档位"
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
                                "id": 9,
                                "name": "客户编号",
                                "type": {
                                    "type": "String"
                                }
                            },
                            {
                                "id": 11,
                                "name": "尺寸",
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
                                        "type": "Number"
                                    }
                                },
                                {
                                    "id": 2,
                                    "name": "毛长",
                                    "type": {
                                        "type": "Number"
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
                                },
                                {
                                    "id": 4,
                                    "name": "位置",
                                    "type": {
                                        "type": "String"
                                    },
                                    "optional": true
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
        "admin/file/PtlGetList/ReqGetList": {
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
                    "name": "pageNum",
                    "type": {
                        "type": "Number"
                    },
                    "optional": true
                },
                {
                    "id": 1,
                    "name": "pageSize",
                    "type": {
                        "type": "Number"
                    },
                    "optional": true
                },
                {
                    "id": 2,
                    "name": "keyword",
                    "type": {
                        "type": "String"
                    },
                    "optional": true
                },
                {
                    "id": 3,
                    "name": "orderSort",
                    "type": {
                        "type": "Union",
                        "members": [
                            {
                                "id": 0,
                                "type": {
                                    "type": "Literal",
                                    "literal": "asc"
                                }
                            },
                            {
                                "id": 1,
                                "type": {
                                    "type": "Literal",
                                    "literal": "desc"
                                }
                            }
                        ]
                    },
                    "optional": true
                },
                {
                    "id": 4,
                    "name": "filter",
                    "type": {
                        "type": "Partial",
                        "target": {
                            "target": {
                                "type": "Reference",
                                "target": "../db/Db沐茵丝假发成品稿/沐茵丝假发成品稿"
                            },
                            "keys": [
                                "客户编号",
                                "品名",
                                "原材料",
                                "假发类型",
                                "CAP"
                            ],
                            "type": "Pick"
                        }
                    },
                    "optional": true
                }
            ]
        },
        "admin/file/PtlGetList/ResGetList": {
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
                },
                {
                    "id": 1,
                    "name": "total",
                    "type": {
                        "type": "Number"
                    }
                },
                {
                    "id": 2,
                    "name": "pageNum",
                    "type": {
                        "type": "Number"
                    }
                },
                {
                    "id": 3,
                    "name": "pageSize",
                    "type": {
                        "type": "Number"
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
                    "id": 5,
                    "name": "客户编号",
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
                    "id": 6,
                    "name": "原材料",
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
        "admin/PtlGetPreview/ReqGetPreview": {
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
        "admin/PtlGetPreview/ResGetPreview": {
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
                    "name": "设计稿总数",
                    "type": {
                        "type": "Number"
                    }
                },
                {
                    "id": 1,
                    "name": "胶丝比例总数",
                    "type": {
                        "type": "Number"
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
            ],
            "properties": [
                {
                    "id": 0,
                    "name": "pageNum",
                    "type": {
                        "type": "Number"
                    },
                    "optional": true
                },
                {
                    "id": 1,
                    "name": "pageSize",
                    "type": {
                        "type": "Number"
                    },
                    "optional": true
                },
                {
                    "id": 2,
                    "name": "keyword",
                    "type": {
                        "type": "String"
                    },
                    "optional": true
                },
                {
                    "id": 3,
                    "name": "orderSort",
                    "type": {
                        "type": "Union",
                        "members": [
                            {
                                "id": 0,
                                "type": {
                                    "type": "Literal",
                                    "literal": "asc"
                                }
                            },
                            {
                                "id": 1,
                                "type": {
                                    "type": "Literal",
                                    "literal": "desc"
                                }
                            }
                        ]
                    },
                    "optional": true
                },
                {
                    "id": 4,
                    "name": "filter",
                    "type": {
                        "type": "Partial",
                        "target": {
                            "type": "Interface",
                            "properties": [
                                {
                                    "id": 0,
                                    "name": "颜色编号",
                                    "type": {
                                        "type": "String"
                                    },
                                    "optional": true
                                },
                                {
                                    "id": 1,
                                    "name": "发丝种类",
                                    "type": {
                                        "type": "String"
                                    },
                                    "optional": true
                                },
                                {
                                    "id": 2,
                                    "name": "线色",
                                    "type": {
                                        "type": "String"
                                    },
                                    "optional": true
                                },
                                {
                                    "id": 3,
                                    "name": "D",
                                    "type": {
                                        "type": "Boolean"
                                    },
                                    "optional": true
                                },
                                {
                                    "id": 4,
                                    "name": "M",
                                    "type": {
                                        "type": "Boolean"
                                    },
                                    "optional": true
                                },
                                {
                                    "id": 5,
                                    "name": "L",
                                    "type": {
                                        "type": "Boolean"
                                    },
                                    "optional": true
                                }
                            ]
                        }
                    },
                    "optional": true
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
                },
                {
                    "id": 1,
                    "name": "total",
                    "type": {
                        "type": "Number"
                    }
                },
                {
                    "id": 2,
                    "name": "pageNum",
                    "type": {
                        "type": "Number"
                    }
                },
                {
                    "id": 3,
                    "name": "pageSize",
                    "type": {
                        "type": "Number"
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
                    "id": 2,
                    "name": "发丝种类",
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
        "admin/user/PtlAdd/ReqAdd": {
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
                    "name": "name",
                    "type": {
                        "type": "String"
                    }
                },
                {
                    "id": 1,
                    "name": "username",
                    "type": {
                        "type": "String"
                    }
                },
                {
                    "id": 2,
                    "name": "password",
                    "type": {
                        "type": "String"
                    }
                }
            ]
        },
        "admin/user/PtlAdd/ResAdd": {
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
        "admin/user/PtlDelete/ReqDelete": {
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
        "admin/user/PtlDelete/ResDelete": {
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
        "admin/user/PtlGetList/ReqGetList": {
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
                    "name": "keyword",
                    "type": {
                        "type": "String"
                    },
                    "optional": true
                }
            ]
        },
        "admin/user/PtlGetList/ResGetList": {
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
                            "target": "admin/user/PtlGetList/UserListItem"
                        }
                    }
                }
            ]
        },
        "admin/user/PtlGetList/UserListItem": {
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
                    "name": "name",
                    "type": {
                        "type": "String"
                    }
                },
                {
                    "id": 2,
                    "name": "username",
                    "type": {
                        "type": "String"
                    }
                },
                {
                    "id": 3,
                    "name": "role",
                    "type": {
                        "type": "Literal",
                        "literal": "admin"
                    }
                },
                {
                    "id": 4,
                    "name": "createTime",
                    "type": {
                        "type": "String"
                    }
                },
                {
                    "id": 5,
                    "name": "updateTime",
                    "type": {
                        "type": "String"
                    }
                }
            ]
        }
    }
};