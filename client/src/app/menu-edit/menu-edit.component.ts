import { Component, ElementRef, EventEmitter, OnInit, Output, ViewChild, ɵɵtrustConstantResourceUrl } from '@angular/core';
import { ActivatedRoute } from '@angular/router'
import { Restaurant } from '../restaurant/entities/restaurant';
import { Menu } from '../menu/entities/menu';
import { RestaurantStoreService } from '../services/restaurant-store.service';
import { ApiClientService } from '../services/api-client.service';
import { UpdateDishDTO } from '../dish/dto/update-dish.dto';
import { Store } from '@ngrx/store';
import {
  updateRestaurants,
} from '../ngrx/actions/admin.actions';
@Component({
  selector: 'app-menu-edit',
  templateUrl: './menu-edit.component.html',
  styleUrls: ['./menu-edit.component.scss'],
})
export class MenuEditComponent implements OnInit {
  restaurantId: string = '-1';
  restaurant: any; // for faster development
  updateRestaurantMenusDTO: UpdateDishDTO;
  menuId: string = '-1';
  menus: Menu [];
  menu: Menu;
  values: string = '';
  restaurantList: Restaurant [] = [];



  constructor(
    private route: ActivatedRoute,
    private restaurantService: RestaurantStoreService,
    private apiClient: ApiClientService,
    private store: Store<{ store: { restaurants: Restaurant[], maliciousRequest: boolean } }>
    ) {
      this.restaurant = new Restaurant();
      this.updateRestaurantMenusDTO = new UpdateDishDTO();
      this.menus = [];
      this.menu = new Menu();
      this.route.url.subscribe(url => {
        this.restaurantId = url[1].path;
        this.menuId = url[3].path;
      });
   }

  //  get diagnostic() { return JSON.stringify(this.updateRestaurantMenusDTO); }

   async getRestaurantDetails() {
    const restaurant = await this.restaurantService.getRestaurant(this.restaurantId);
    this.restaurant = restaurant;
    this.menus = this.restaurant.menus;
    this.menu = this.restaurant.menus.filter((menu: any) => menu._id === this.menuId )[0];
   }

   mapRestaurantMenusToMenuUpdateValues() {
    return this.menus.map((menu:Menu) => {
      const _id = menu._id;
      const menuName = menu.name;
      const dishes = menu.dishes?.map((dish) => {
        return {
          _id: dish._id,
          name: dish.name,
          price: dish.price
        }
       });
      return {
        _id: _id,
        name: menuName,
        dishes: dishes
      }
     })
   }

   updateRestaurants(restaurants: []) {
    this.store.dispatch(updateRestaurants({
      restaurants,
    }));
  }

  async submit(e:any) {
    e.preventDefault();
    // values for update
    const menuName = e.target.menuname.value;
    const dishName = e.target.dishname.value;
    const dishId = e.target.dish_id.value; // use of bcrypt ?
    const menuId = e.target.menu_id.value; // use of bcrypt ?
    let price = e.target.price.value;
    price = price.slice(1, price.length);

    this.updateRestaurantMenusDTO.name = dishName;
    this.updateRestaurantMenusDTO.menuName = menuName;
    this.updateRestaurantMenusDTO.price = price;

    // call update with api client
    const body = this.updateRestaurantMenusDTO;

    let updateResponse;
    await this.apiClient.updateDish(this.restaurantId, this.menuId, dishId, body)
    .toPromise()
    .then((data: any) => updateResponse = data);

    console.log("UPDATE REPSONSE")
    console.log(updateResponse);

    // update store
    // get data from behavioural subject
    this.restaurantService.restaurantList$.subscribe((restaurants: Restaurant []) => {
      this.restaurantList = restaurants;
    });
    // check to add or remove the dish
    const indexRestaurant = this.restaurantList.findIndex((restaurant) => restaurant._id === this.restaurantId);
    const restaurantForUpdate = this.restaurantList[indexRestaurant];
    // find menu which has been updated
    console.log(menuId)
    let indexMenu;
    if(menuName) {
      indexMenu = restaurantForUpdate.menus.findIndex((menu) => menu.name === menuName);
    } else {
      indexMenu = restaurantForUpdate.menus.findIndex((menu) => menu._id === menuId);
    }
    const menuForUpdate = restaurantForUpdate.menus[indexMenu];
    console.log(menuForUpdate);

    // this.restaurantList.forEach((restaurant) => {
    //   if(restaurant._id === this.restaurantId) {
    //     restaurant.menus.for
    //   }
    // })


    // update via reducer
    // update restaurant list
    // remove/add dish from menu list within dishes list
    // remove from restaurants dishes list not implemented

    // this.updateRestaurants()

  }







  async ngOnInit(): Promise<void> {
    await this.restaurantService.getRestaurants();
    await this.getRestaurantDetails();
  }
}
