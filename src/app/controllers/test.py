import json
import pandas as pd

from interfaces.controller import controller

from entities.users import users
from entities.departments import departments
from entities.actions import actions


class test(controller):

    @staticmethod
    def init(args=None):

        for resp in ['available', 'customer', 'industrial', 'fulfillment', 'quality', 'planning', 'none']:
            departments(name=resp).save()

        for action in [
            ("Alterar obsolescência", "01 -> 02")
            , ("Cobrar sucateamento", "O3 ainda não sucateado (O2)")
            , ("Avaliar oportunidade de escoamento", "Procurar oportunidades (escoamento, pedidos, FIFO, etc) para items sem demanda")
            , ("Acompanhar WO", "Cobrar a execução dos O3")
            , ("Cobrar pedido do cliente", "Em casos de demanda parcial")
            , ("Avaliar liberação do estoque", "Procurar ações de Qualidade/Expedição para estoque bloqeado")
            , ("Solicitar apoio comercial", "Levantamento de custos WO ou negociação de demanda e WO")
            , ("Transferir estoque", "Para casos de otimizar a formação de carga para escoamento (especificar centro Ball)")
            , ("Puxar conforme demanda", "Para estoque vendável")
        ]:
            actions(name=action[0], description=action[1]).save()

        users(username="rafsb", email="rafael.bertolini@ball.com", pswd="1509347", status=2).save()

        # df = pd.read_excel('src/var/base.xlsx')
        # json_object = json.loads(df.to_json(orient='records'))

        # for line in json_object:
        #     departments[(line["De quem é a responsabildiade?"] or '').lower()] = True

        # print(departments.keys())

        return "Hello World"


def register(app, args=None) : pass
